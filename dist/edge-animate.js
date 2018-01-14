var edge = (function (exports) {
'use strict';

var _ = undefined;
var upperCasePattern = /[A-Z]/g;
var propLower = function (m) { return "-" + m.toLowerCase(); };
var msPattern = /^ms-/;

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
function waapiToString(keyframes) {
    return framesToString(waapiToKeyframes(keyframes));
}

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
function stringHash(str) {
    var value = 5381;
    var len = str.length;
    while (len--) {
        value = (value * 33) ^ str.charCodeAt(len);
    }
    return (value >>> 0).toString(36);
}
function insertKeyframes(rules) {
    var hash = 'ea_' + stringHash(rules);
    if (!allKeyframes[hash]) {
        allKeyframes[hash] = rules;
        renderStyles();
    }
    return hash;
}

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
    if (!timing.delay) {
        timing.delay = 0;
    }
    if (!timing.endDelay) {
        timing.endDelay = 0;
    }
    var self = Object.create(Animation.prototype);
    self._element = element;
    self._rate = 1;
    self.pending = false;
    var fill = timing.fill;
    var fillBoth = fill === 'both';
    self._isFillForwards = fillBoth || fill === 'forwards';
    self._isFillBackwards = fillBoth || fill === 'backwards';
    var rules = waapiToString(keyframes);
    self.id = insertKeyframes(rules);
    var style = element.style;
    style.animationTimingFunction = timing.easing;
    style.animationDuration = timing.duration + 'ms';
    style.animationIterationCount = timing.iterations === Infinity ? 'infinite' : timing.iterations + '';
    style.animationDirection = timing.direction;
    style.animationFillMode = timing.fill;
    self._timing = timing;
    self._totalTime = (timing.delay || 0) + timing.duration * timing.iterations + (timing.endDelay || 0);
    self._yoyo = timing.direction.indexOf('alternate') !== -1;
    self._reverse = timing.direction.indexOf('reverse') !== -1;
    self.finish = self.finish.bind(self);
    self.play();
    return self;
}
Animation.prototype = {
    get currentTime() {
        return _update(this)._time;
    },
    set currentTime(val) {
        this._time = val;
        _update(this);
    },
    get playbackRate() {
        return _update(this)._rate;
    },
    set playbackRate(val) {
        this._rate = val;
        _update(this);
    },
    get playState() {
        return _update(this)._state;
    },
    cancel: function () {
        var self = this;
        self._time = self._last = _;
        _update(self);
        _clearFinish(self);
        self.oncancel && self.oncancel();
    },
    finish: function () {
        var self = this;
        self._time = self._rate >= 0 ? self._totalTime : 0;
        if (self._state !== 'finished') {
            _update(self);
        }
        _clearFinish(self);
        self.onfinish && self.onfinish();
    },
    play: function () {
        var self = this;
        var isForwards = self._rate >= 0;
        var isCanceled = self._time === _;
        if (isForwards && (isCanceled || self._time >= self._totalTime)) {
            self._time = 0;
        }
        else if (!isForwards && (isCanceled || self._time <= 0)) {
            self._time = self._totalTime;
        }
        self._last = performance.now();
        _update(self);
    },
    pause: function () {
        this._last = _;
        _update(this);
    },
    reverse: function () {
        this._rate *= -1;
        _update(this);
    }
};
function _clearFinish(self) {
    if (self._finishTaskId) {
        clearTimeout(self._finishTaskId);
    }
}
function _updateElement(self) {
    var el = self._element;
    var state = self._state;
    var style = el.style;
    if (state === 'idle') {
        style.animationName = style.animationPlayState = style.animationDelay = '';
    }
    else {
        style.animationName = '';
        void el.offsetWidth;
        style.animationDelay = -_localTime(self) + 'ms';
        style.animationPlayState = state === 'finished' || state === 'paused' ? 'paused' : state;
        style.animationName = self.id;
        console.log(-_localTime(self) + 'ms', state, self.id);
    }
}
function _localTime(self) {
    var timing = self._timing;
    var timeLessDelay = self._time - (timing.delay + timing.endDelay);
    var localTime = timeLessDelay % timing.duration;
    if (self._reverse) {
        localTime = self._timing.duration - localTime;
    }
    if (self._yoyo && !(Math.floor(timeLessDelay / timing.duration) % 2)) {
        localTime = self._timing.duration - localTime;
    }
    return self._totalTime < localTime ? self._totalTime : localTime < 0 ? 0 : localTime;
}
function _update(self) {
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
            if (isForwards && self._isFillForwards) {
                time = self._totalTime;
            }
            if (!isForwards && self._isFillBackwards) {
                time = 0;
            }
        }
        else {
            playState = 'running';
        }
    }
    self._state = playState;
    self._time = time;
    _updateElement(self);
    _updateSchedule(self);
    return self;
}
function _updateSchedule(self) {
    _clearFinish(self);
    var isForwards = self._rate >= 0;
    var _remaining = isForwards ? self._totalTime - self._time : self._time;
    self._finishTaskId = setTimeout(self.finish, _remaining);
}

if (typeof Element.prototype.animate !== 'undefined') {
    Element.prototype.animate = function (keyframes, timings) {
        return animate(this, keyframes, timings);
    };
}
function animate(el, keyframes, timings) {
    return Animation(el, keyframes, timings);
}

exports.animate = animate;

return exports;

}({}));
