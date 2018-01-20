var edge = (function (exports) {
'use strict';

var upperCasePattern = /[A-Z]/g;
var propLower = function (m) { return "-" + m.toLowerCase(); };
var msPattern = /^ms-/;
var _ = undefined;
var idle = 'idle';
var finished = 'finished';
var milliseconds = 'ms';
var paused = 'paused';
var running = 'running';

function hyphenate(propertyName) {
    return (propertyName
        .replace(upperCasePattern, propLower)
        .replace(msPattern, '-ms-'));
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
    var frames = {};
    for (var i = 0, ilen = keyframes.length; i < ilen; i++) {
        var keyframe = keyframes[i];
        var offset = keyframe.offset;
        var target = frames[offset] || (frames[offset] = {});
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
    var keys = Object.keys(frames).sort();
    var jlen = keys.length;
    var rules = Array(jlen);
    for (var j = 0; j < jlen; j++) {
        var key = keys[j];
        rules[j] = +key * 100 + '%{' + propsToString(frames[key]) + '}';
    }
    return rules.join('\n');
}

var allKeyframes = {};
var taskId;
var styleElement;
function renderStyles() {
    taskId = taskId || setTimeout(forceRender, 0);
}
function forceRender() {
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

var epsilon = 0.0001;
function now() {
    return performance.now();
}
function Animation(element, keyframes, timing) {
    timing.direction = timing.direction || 'normal';
    timing.easing = timing.easing || 'linear';
    timing.iterations = timing.iterations || 1;
    timing.fill = timing.fill || 'none';
    timing.delay = timing.delay || 0;
    timing.endDelay = timing.endDelay || 0;
    var self = this;
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
    style.animationDuration = timing.duration + milliseconds;
    style.animationIterationCount = timing.iterations === Infinity ? 'infinite' : timing.iterations + '';
    style.animationDirection = timing.direction;
    style.animationFillMode = timing.fill;
    self._timing = timing;
    self._totalTime = (timing.delay || 0) + timing.duration * timing.iterations + (timing.endDelay || 0);
    self._yoyo = timing.direction.indexOf('alternate') !== -1;
    self._reverse = timing.direction.indexOf('reverse') !== -1;
    self.finish = self.finish.bind(self);
    self.play();
}
Animation.prototype = {
    get currentTime() {
        return updateTiming(this)._time;
    },
    set currentTime(val) {
        this._time = val;
        updateTiming(this);
    },
    get playbackRate() {
        return updateTiming(this)._rate;
    },
    set playbackRate(val) {
        this._rate = val;
        updateTiming(this);
    },
    get playState() {
        return updateTiming(this)._state;
    },
    cancel: function () {
        var self = this;
        self._time = self._startTime = _;
        self._state = idle;
        updateElement(self);
        clearFinishTimeout(self);
        self.oncancel && self.oncancel();
    },
    finish: function () {
        var self = this;
        moveToFinish(self);
        updateTiming(self);
        clearFinishTimeout(self);
        self.onfinish && self.onfinish();
    },
    play: function () {
        var self = this;
        var isForwards = self._rate >= 0;
        var isCanceled = self._time === _;
        var time = isCanceled ? _ : Math.round(self._time);
        if (isForwards && (isCanceled || time >= self._totalTime)) {
            self._time = 0;
        }
        else if (!isForwards && (isCanceled || time <= 0)) {
            self._time = self._totalTime;
        }
        self._startTime = now();
        this._state = running;
        updateTiming(self);
    },
    pause: function () {
        var self = this;
        if (self._state !== finished) {
            self._state = paused;
        }
        updateTiming(this);
    },
    reverse: function () {
        this._rate *= -1;
        updateTiming(this);
    }
};
function clearFinishTimeout(self) {
    self._finishTaskId && clearTimeout(self._finishTaskId);
}
function updateElement(self) {
    var el = self._element;
    var state = self._state;
    var style = el.style;
    if (state === idle) {
        style.animationName = style.animationPlayState = style.animationDelay = '';
    }
    else {
        if (!isFinite(self._time)) {
            self._time = self._rate >= 0 ? 0 : self._totalTime;
        }
        style.animationName = '';
        void el.offsetWidth;
        style.animationDelay = -toLocalTime(self) + milliseconds;
        style.animationPlayState = state === finished || state === paused ? paused : state;
        style.animationName = self.id;
        console.log(-toLocalTime(self) + milliseconds, state, self.id);
    }
}
function toLocalTime(self) {
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
function moveToFinish(self) {
    var isForwards = self._rate >= 0;
    self._state = finished;
    if (isForwards && self._isFillForwards) {
        self._time = self._totalTime - epsilon;
    }
    if (!isForwards && self._isFillBackwards) {
        self._time = 0 + epsilon;
    }
    self._startTime = _;
}
function updateTiming(self) {
    var startTime = self._startTime;
    var state = self._state;
    var next = now();
    var time;
    var isFinished = self._state === finished;
    var isPaused = state === paused;
    if (!isFinished) {
        time = Math.round(self._time + (next - startTime));
        self._time = time;
    }
    if (!isPaused && !isFinished) {
        self._startTime = next;
        var isForwards = self._rate >= 0;
        if ((isForwards && time >= self._totalTime) || (!isForwards && time <= 0)) {
            self.finish();
            return;
        }
    }
    updateElement(self);
    clearFinishTimeout(self);
    if (!isPaused && !isFinished) {
        updateScheduler(self);
    }
    return self;
}
function updateScheduler(self) {
    if (self._state !== running) {
        return;
    }
    var isForwards = self._rate >= 0;
    var _remaining = isForwards ? self._totalTime - self._time : self._time;
    self._finishTaskId = setTimeout(self.finish, _remaining);
}

exports.isPolyflled = false;
function polyfill() {
    exports.isPolyflled = true;
    Element.prototype.animate = function (keyframes, timings) {
        return new Animation(this, keyframes, timings);
    };
}
if (typeof Element.prototype.animate !== 'undefined') {
    polyfill();
}

exports.forceRender = forceRender;
exports.polyfill = polyfill;

return exports;

}({}));
