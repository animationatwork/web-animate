var edge = (function (exports) {
'use strict';

var _ = undefined;
var upperCasePattern = /[A-Z]/g;
var propLower = function (m) { return "-" + m.toLowerCase(); };
var msPattern = /^ms-/;
var allKeyframes = {};
var taskId;
var styleElement;
function renderStyles() {
    taskId = taskId || setTimeout(renderStylesheet, 0);
}
function renderStylesheet() {
    taskId = 0;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.setAttribute('rel', 'stylesheet');
        document.head.appendChild(styleElement);
    }
    var contents = '';
    for (var key in allKeyframes) {
        contents += '@keyframes ' + key + '{' + allKeyframes[key] + '}';
    }
    styleElement.innerHTML = contents;
}
function insertKeyframes(keyframes) {
    var rules = framesToString(waapiToKeyframes(keyframes));
    var hash = 'ea_' + stringHash(rules);
    if (!allKeyframes[hash]) {
        allKeyframes[hash] = rules;
        renderStyles();
    }
    return hash;
}
function stringHash(str) {
    var value = 5381;
    var len = str.length;
    while (len--) {
        value = (value * 33) ^ str.charCodeAt(len);
    }
    return (value >>> 0).toString(36);
}
function hyphenate(propertyName) {
    return (propertyName
        .replace(upperCasePattern, propLower)
        .replace(msPattern, '-ms-'));
}
function waapiToKeyframes(keyframes) {
    var results = {};
    for (var i = 0, ilen = keyframes.length; i < ilen; i++) {
        var keyframe = keyframes[i];
        var offset = keyframe.offset;
        var target = results[offset] || (results[offset] = {});
        for (var key in keyframe) {
            var newKey = key;
            if (key === 'easing') {
                newKey = 'animation-timing-function';
            }
            if (key !== 'offset') {
                target[newKey] = keyframe[key];
            }
        }
    }
    return results;
}
function framesToString(keyframes) {
    var keys = Object.keys(keyframes).sort();
    var ilen = keys.length;
    var rules = Array(ilen);
    for (var i = 0; i < ilen; i++) {
        var key = keys[i];
        rules[i] = +key * 100 + '%{' + propsToString(keyframes[key]) + '}';
    }
    return rules.join('\n');
}
function propsToString(keyframe) {
    var rules = [];
    for (var key in keyframe) {
        var value = keyframe[key];
        if (value !== null && value !== _) {
            rules.push(hyphenate(key.trim()) + ':' + value);
        }
    }
    return rules.sort().join(';');
}
var EdgeAnimation = (function () {
    function EdgeAnimation(element, keyframes, timing) {
        var _this = this;
        this.finish = function () {
            var self = _this;
            self._time = self._rate >= 0 ? self._totalTime : 0;
            self._update();
            self._clearFinish();
            self.onfinish && self.onfinish();
        };
        timing = timing || {};
        if (!timing.direction) {
            timing.direction = 'normal';
        }
        if (!timing.easing) {
            timing.easing = 'linear';
        }
        if (!timing.iterations) {
            timing.iterations = 1;
        }
        if (!timing.delay) {
            timing.delay = 0;
        }
        if (!timing.fill) {
            timing.fill = 'none';
        }
        var self = this;
        self._element = element;
        self._rate = 1;
        self.pending = false;
        var animationName = insertKeyframes(keyframes);
        self.id = animationName;
        var style = element.style;
        style.animationTimingFunction = timing.easing;
        style.animationDuration = timing.duration + 'ms';
        style.animationIterationCount = timing.iterations + '';
        style.animationDirection = timing.direction;
        style.animationFillMode = timing.fill;
        self._timing = timing;
        self._totalTime = (timing.delay || 0) + timing.duration * timing.iterations + (timing.endDelay || 0);
        self._yoyo = timing.direction.indexOf('alternate') !== -1;
        self._reverse = timing.direction.indexOf('reverse') !== -1;
        self.play();
    }
    Object.defineProperty(EdgeAnimation.prototype, "currentTime", {
        get: function () {
            return this._update()._time;
        },
        set: function (val) {
            this._time = val;
            this._update();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EdgeAnimation.prototype, "playbackRate", {
        get: function () {
            return this._update()._rate;
        },
        set: function (val) {
            this._rate = val;
            this._update();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EdgeAnimation.prototype, "playState", {
        get: function () {
            return this._update()._state;
        },
        enumerable: true,
        configurable: true
    });
    EdgeAnimation.prototype.cancel = function () {
        var self = this;
        self._time = self._last = _;
        self._update();
        self._clearFinish();
        self.oncancel && self.oncancel();
    };
    EdgeAnimation.prototype.play = function () {
        var self = this;
        var isForwards = self._rate >= 0;
        var isCanceled = self._time === _;
        if ((isForwards && isCanceled) || self._time === self._totalTime) {
            self._time = 0;
        }
        else if ((!isForwards && isCanceled) || self._time === 0) {
            self._time = self._totalTime;
        }
        self._last = performance.now();
        self._update();
    };
    EdgeAnimation.prototype.pause = function () {
        var self = this;
        self._last = _;
        self._update();
    };
    EdgeAnimation.prototype.reverse = function () {
        var self = this;
        self._rate *= -1;
        self._update();
    };
    EdgeAnimation.prototype._clearFinish = function () {
        var self = this;
        if (self._finishTaskId) {
            clearTimeout(self._finishTaskId);
        }
    };
    EdgeAnimation.prototype._updateElement = function () {
        var self = this;
        var el = self._element;
        var state = self._state;
        var style = el.style;
        if (state === 'idle') {
            style.animationName = style.animationPlayState = style.animationDelay = '';
        }
        else {
            style.animationName = self.id;
            style.animationPlayState = state === 'running' ? state : '';
            style.animationDelay = -self._localTime() + 'ms';
        }
    };
    EdgeAnimation.prototype._localTime = function () {
        var self = this;
        var timing = self._timing;
        var timeLessDelay = self._time - (timing.delay + timing.endDelay);
        var localTime = timeLessDelay % timing.duration;
        if (self._reverse) {
            localTime = self._timing.duration - localTime;
        }
        if (self._yoyo && !(Math.floor(timeLessDelay / timing.duration) % 2)) {
            localTime = self._timing.duration - localTime;
        }
        return localTime;
    };
    EdgeAnimation.prototype._update = function () {
        var self = this;
        var playState;
        var time = self._time;
        var last = self._last;
        if (time === _) {
            playState = 'idle';
        }
        else if (last === _) {
            playState = 'paused';
        }
        else {
            var next = performance.now();
            var delta = next - last;
            last = next;
            time += delta;
            var isForwards = self._rate >= 0;
            if ((isForwards && time >= self._totalTime) || (!isForwards && time <= 0)) {
                playState = 'finished';
            }
            else {
                playState = 'running';
            }
        }
        self._state = playState;
        self._time = time;
        self._updateElement();
        self._updateSchedule();
        return self;
    };
    EdgeAnimation.prototype._updateSchedule = function () {
        var self = this;
        self._clearFinish();
        var isForwards = self._rate >= 0;
        var _remaining = isForwards ? self._totalTime - self._time : self._time;
        self._finishTaskId = setTimeout(self.finish, _remaining);
    };
    return EdgeAnimation;
}());
if (typeof Element.prototype.animate !== 'undefined') {
    Element.prototype.animate = function (keyframes, timings) {
        return animate(this, keyframes, timings);
    };
}
function animate(el, keyframes, timings) {
    return new EdgeAnimation(el, keyframes, timings);
}

exports.animate = animate;

return exports;

}({}));
