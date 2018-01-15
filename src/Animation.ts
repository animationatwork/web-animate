import { IKeyframe, IEffectTiming, IAnimation, PlayState } from './types'
import { waapiToString } from './waapiToString'
import { insertKeyframes } from './styles'
import { _, finished, idle, paused, milliseconds, running } from './constants'

const epsilon = 0.0001

function now() {
    return performance.now()
}

/**
 * IAnimation + private fields
 */
interface IEdgeAnimation extends IAnimation {
    _time: number
    _totalTime: number
    _startTime: number
    _element: HTMLElement
    _timing: IEffectTiming
    _rate: number
    _state: PlayState
    _yoyo: boolean
    _reverse: boolean
    _finishTaskId: any
    _isFillForwards: boolean
    _isFillBackwards: boolean
}

export function Animation(element: HTMLElement, keyframes: IKeyframe[], timing: IEffectTiming) {
    // set default options
    timing.direction = timing.direction || 'normal'
    timing.easing = timing.easing || 'linear'
    timing.iterations = timing.iterations || 1
    timing.fill = timing.fill || 'none'
    timing.delay = timing.delay || 0
    timing.endDelay = timing.endDelay || 0

    // cast self as internal version of Animation
    const self = this as IEdgeAnimation
    self._element = element
    self._rate = 1
    self.pending = false

    // determine how css will handle filling time values
    const fill = timing.fill
    const fillBoth = fill === 'both'
    self._isFillForwards = fillBoth || fill === 'forwards'
    self._isFillBackwards = fillBoth || fill === 'backwards'

    // insert animation definition
    const rules = waapiToString(keyframes)
    self.id = insertKeyframes(rules)

    // set animation options on element
    const style = element.style
    style.animationTimingFunction = timing.easing
    style.animationDuration = timing.duration + milliseconds
    style.animationIterationCount = timing.iterations === Infinity ? 'infinite' : timing.iterations + ''
    style.animationDirection = timing.direction
    style.animationFillMode = timing.fill

    // calculate total time and set timing
    self._timing = timing
    self._totalTime = (timing.delay || 0) + timing.duration * timing.iterations + (timing.endDelay || 0)

    // calculate direction
    self._yoyo = timing.direction.indexOf('alternate') !== -1
    self._reverse = timing.direction.indexOf('reverse') !== -1

    // bind methods used in timeouts
    self.finish = self.finish.bind(self)

    // start playing
    self.play()
}

Animation.prototype = {
    get currentTime(this: IEdgeAnimation): number {
        return updateTiming(this)._time
    },
    set currentTime(this: IEdgeAnimation, val: number) {
        this._time = val
        updateTiming(this)
    },
    get playbackRate(this: IEdgeAnimation): number {
        return updateTiming(this)._rate
    },
    set playbackRate(val: number) {
        this._rate = val
        updateTiming(this)
    },
    get playState(this: IEdgeAnimation): PlayState {
        return updateTiming(this)._state
    },
    cancel(this: IEdgeAnimation): void {
        const self = this
        self._time = self._startTime = _
        self._state = idle
        updateElement(self)
        clearFinishTimeout(self)
        // tslint:disable-next-line:no-unused-expression
        self.oncancel && self.oncancel()
    },
    finish(this: IEdgeAnimation) {
        const self = this
        self._time = self._rate >= 0 ? self._totalTime : 0
        if (self._state !== finished) {
            updateTiming(self)
        }
        clearFinishTimeout(self)
        // tslint:disable-next-line:no-unused-expression
        self.onfinish && self.onfinish()
    },
    play(this: IEdgeAnimation): void {
        const self = this

        // update time if applicable
        const isForwards = self._rate >= 0
        const isCanceled = self._time === _
        const time = isCanceled ? _ : Math.round(self._time)
        if (isForwards && (isCanceled || time >= self._totalTime)) {
            self._time = 0
        } else if (!isForwards && (isCanceled || time <= 0)) {
            self._time = self._totalTime
        }

        self._startTime = now()
        this._state = running
        updateTiming(self)
    },
    pause(this: IEdgeAnimation): void {
        const self = this
        self._state = paused
        updateTiming(this)
    },
    reverse(this: IEdgeAnimation): void {
        this._rate *= -1
        updateTiming(this)
    }
}

function clearFinishTimeout(self: IEdgeAnimation) {
    // clear last timeout
    // tslint:disable-next-line:no-unused-expression
    self._finishTaskId && clearTimeout(self._finishTaskId)
}
function updateElement(self: IEdgeAnimation) {
    const el = self._element
    const state = self._state

    // update element
    const style = el.style
    if (state === idle) {
        style.animationName = style.animationPlayState = style.animationDelay = ''
    } else {
        style.animationName = ''
        // tslint:disable-next-line:no-unused-expression
        void el.offsetWidth

        style.animationDelay = -toLocalTime(self) + milliseconds
        style.animationPlayState = state === finished || state === paused ? paused : state
        style.animationName = self.id

        console.log(-toLocalTime(self) + milliseconds, state, self.id)
    }
}
function toLocalTime(self: IEdgeAnimation) {
    // get progression on this iteration
    const timing = self._timing
    const timeLessDelay = self._time - (timing.delay + timing.endDelay)
    let localTime = timeLessDelay % timing.duration
    if (self._reverse) {
        // reverse if reversed
        localTime = self._timing.duration - localTime
    }
    if (self._yoyo && !(Math.floor(timeLessDelay / timing.duration) % 2)) {
        // reverse if alternated and on an odd iteration
        localTime = self._timing.duration - localTime
    }
    return self._totalTime < localTime ? self._totalTime : localTime < 0 ? 0 : localTime
}

function updateTiming(self: IEdgeAnimation) {
    const startTime = self._startTime
    const state = self._state
    let next = now()
    let time = Math.round(self._time + (next - startTime))
    self._time = time

    const isPaused = state === paused || state === finished
    if (!isPaused) {
        self._startTime = next

        const isForwards = self._rate >= 0
        if ((isForwards && time >= self._totalTime) || (!isForwards && time <= 0)) {
            // check if state has transitioned to finish
            self._state = finished
            if (isForwards && self._isFillForwards) {
                // move playhead to the end (minus a little bit to prevent setting to 0)
                self._time = self._totalTime - epsilon
            }
            if (!isForwards && self._isFillBackwards) {
                // move playhead to the end (plus a little bit to prevent setting to total time)
                self._time = 0 + epsilon
            }

            // remove startTime since the "timer" isn't running
            self._startTime = _
        }
    }

    updateElement(self)
    clearFinishTimeout(self)

    if (!isPaused) {
        updateScheduler(self)
    }
    return self
}
function updateScheduler(self: IEdgeAnimation) {
    if (self._state !== running) {
        // if the animation isn't running, there is no point in scheduling the finish
        return
    }
    // recalculate time remaining and set a timeout for it
    const isForwards = self._rate >= 0
    const _remaining = isForwards ? self._totalTime - self._time : self._time
    self._finishTaskId = setTimeout(self.finish, _remaining)
}
