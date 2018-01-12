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
var Animation = (function () {
    function Animation(element, keyframes, timing) {
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
        var animationName = insertKeyframes(keyframes);
        self._hash = animationName;
        var style = element.style;
        style.animation = timing.duration + "ms " + timing.easing + " " + timing.delay + "ms " + timing.iterations + " " + timing.direction + " " + timing.fill + " " + animationName;
        self._timing = timing;
        self._totalTime = (timing.delay || 0) + timing.duration * timing.iterations + (timing.endDelay || 0);
        self._yoyo = timing.direction.indexOf('alternate') !== -1;
        self._reverse = timing.direction.indexOf('reverse') !== -1;
        self.play();
    }
    Object.defineProperty(Animation.prototype, "currentTime", {
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
    Object.defineProperty(Animation.prototype, "playbackRate", {
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
    Object.defineProperty(Animation.prototype, "playState", {
        get: function () {
            return this._update()._state;
        },
        enumerable: true,
        configurable: true
    });
    Animation.prototype.cancel = function () {
        var self = this;
        self._time = self._last = _;
        self._update();
    };
    Animation.prototype.finish = function () {
        var self = this;
        self._time = self._rate >= 0 ? self._totalTime : 0;
        self._update();
    };
    Animation.prototype.play = function () {
        var self = this;
        var isForwards = self._rate >= 0;
        if (isForwards && self._time === self._totalTime) {
            self._time = 0;
        }
        else if (!isForwards && self._time === 0) {
            self._time = self._totalTime;
        }
        self._last = performance.now();
        self._update();
    };
    Animation.prototype.pause = function () {
        var self = this;
        self._last = _;
        self._update();
    };
    Animation.prototype.reverse = function () {
        var self = this;
        self._rate *= -1;
        self._update();
    };
    Animation.prototype._updateElement = function () {
        var self = this;
        var el = self._element;
        var timing = self._timing;
        var style = el.style;
        var ps = self._state;
        var playState = ps === 'finished' || ps === 'paused' ? 'paused' : ps === 'running' ? 'running' : '';
        var timeLessDelay = self._time - (timing.delay + timing.endDelay);
        var localTime = timeLessDelay % timing.duration;
        var iteration = Math.floor(timeLessDelay / timing.duration);
        if (self._reverse) {
            localTime = self._timing.duration - localTime;
        }
        if (self._yoyo && !(iteration % 2)) {
            localTime = self._timing.duration - localTime;
        }
        console.log(self._hash);
        style.animationPlayState = playState;
        style.animationDelay = -localTime + 'ms';
    };
    Animation.prototype._update = function () {
        var self = this;
        var playState;
        var time = self._time;
        if (self._time === _) {
            playState = 'idle';
        }
        else if (self._last === _) {
            playState = 'paused';
        }
        else {
            var delta = performance.now() - self._last;
            time += delta;
            if (self._time > self._totalTime) {
                playState = 'finished';
            }
            else {
                playState = 'running';
            }
        }
        self._state = playState;
        self._time = time;
        self._updateElement();
        return self;
    };
    return Animation;
}());
if (typeof Element.prototype.animate !== 'undefined') {
    Element.prototype.animate = function (keyframes, timings) {
        return new Animation(this, keyframes, timings);
    };
}

exports.Animation = Animation;

return exports;

}({}));
