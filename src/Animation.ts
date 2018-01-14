import { IKeyframe, IEffectTiming, IAnimation, PlayState } from './types'
import { waapiToString } from './waapiToString'
import { insertKeyframes } from './styles'
import { _, finished, idle, paused, milliseconds } from './constants'

/**
 * IAnimation + private fields
 */
interface IEdgeAnimation extends IAnimation {
    _time: number
    _totalTime: number
    _last: number
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

export function Animation(
    element: HTMLElement,
    keyframes: IKeyframe[],
    timing: IEffectTiming
): IAnimation {
    // set default options
    timing = timing || {}
    if (!timing.direction) {
        timing.direction = 'normal'
    }
    if (!timing.easing) {
        timing.easing = 'linear'
    }
    if (!timing.iterations) {
        timing.iterations = 1
    }
    if (!timing.delay) {
        timing.delay = 0
    }
    if (!timing.fill) {
        timing.fill = 'none'
    }
    if (!timing.delay) {
        timing.delay = 0
    }
    if (!timing.endDelay) {
        timing.endDelay = 0
    }

    // cast self as internal version of Animation
    const self = Object.create(Animation.prototype) as IEdgeAnimation
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

    return self
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
        self._time = self._last = _
        updateTiming(self)
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
        if (isForwards && (isCanceled || self._time >= self._totalTime)) {
            self._time = 0
        } else if (!isForwards && (isCanceled || self._time <= 0)) {
            self._time = self._totalTime
        }

        self._last = performance.now()
        updateTiming(self)
    },
    pause(this: IEdgeAnimation): void {
        this._last = _
        updateTiming(this)
    },
    reverse(this: IEdgeAnimation): void {
        this._rate *= -1
        updateTiming(this)
    }
}

function clearFinishTimeout(self: IEdgeAnimation) {
    if (self._finishTaskId) {
        // clear last timeout
        clearTimeout(self._finishTaskId)
    }
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

    let playState: PlayState
    let time = self._time
    let last = self._last
    if (time === _) {
        playState = idle
    } else if (last === _) {
        playState = paused
    } else {
        const next = performance.now()
        const delta = next - last
        last = next
        time += delta

        const isForwards = self._rate >= 0
        if ((isForwards && time >= self._totalTime) || (!isForwards && time <= 0)) {
            playState = finished
            if (isForwards && self._isFillForwards) {
                time = self._totalTime
            }
            if (!isForwards && self._isFillBackwards) {
                time = 0
            }
        } else {
            playState = 'running'
        }
    }

    self._state = playState
    self._time = time
    updateElement(self)
    updateScheduler(self)
    return self
}
function updateScheduler(self: IEdgeAnimation) {
    clearFinishTimeout(self)

    // recalculate time remaining and set a timeout for it
    const isForwards = self._rate >= 0
    const _remaining = isForwards ? self._totalTime - self._time : self._time
    self._finishTaskId = setTimeout(self.finish, _remaining)
}
