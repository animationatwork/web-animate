import { IKeyframe, IEffectTiming, IAnimation, PlayState } from './types'
import { waapiToString } from './waapiToString'
import { insertKeyframes } from './styles'
import { _, finished, idle, paused, running } from './constants'
import { now, nextFrame } from './globals'

const epsilon = 0.0001

/**
 * IAnimation + private fields
 */
interface IWebAnimation extends IAnimation {
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
    _fillB: boolean
    _fillF: boolean
}

export function Animation(element: HTMLElement, keyframes: IKeyframe[], timingOrDuration: IEffectTiming | number) {
    const timing =
        typeof timingOrDuration === 'number'
            ? { duration: timingOrDuration as number }
            : (timingOrDuration as IEffectTiming)

    // set default options
    timing.direction = timing.direction || 'normal'
    timing.easing = timing.easing || 'linear'
    timing.iterations = timing.iterations || 1
    timing.fill = timing.fill || 'none'
    timing.delay = timing.delay || 0
    timing.endDelay = timing.endDelay || 0

    // cast self as internal version of Animation
    const self = this as IWebAnimation
    self._element = element
    self._rate = 1

    // determine how css will handle filling time values
    const fill = timing.fill
    const fillBoth = fill === 'both'
    self._fillB = fillBoth || fill === 'forwards'
    self._fillF = fillBoth || fill === 'backwards'

    // insert animation definition
    const rules = waapiToString(keyframes)
    self.id = insertKeyframes(rules)

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
    get currentTime(this: IWebAnimation): number {
        const time = updateTiming(this)._time
        // tslint:disable-next-line:no-null-keyword
        return isFinite(time) ? time : null
    },
    set currentTime(this: IWebAnimation, val: number) {
        const self = this
        self._time = val
        updateTiming(self)
        scheduleOnFinish(self)
        updateElement(self)
    },
    get playbackRate(this: IWebAnimation): number {
        return updateTiming(this)._rate
    },
    set playbackRate(val: number) {
        const self = this
        self._rate = val
        updateTiming(self)
        scheduleOnFinish(self)
        updateElement(self)
    },
    get playState(this: IWebAnimation): PlayState {
        return updateTiming(this)._state
    },
    cancel(this: IWebAnimation): void {
        const self = this
        updateTiming(self)

        self._time = self._startTime = _
        self._state = idle

        clearOnFinish(self)
        updateElement(self)
        // tslint:disable-next-line:no-unused-expression
        self.oncancel && self.oncancel()
    },
    finish(this: IWebAnimation) {
        const self = this
        updateTiming(self)

        const start = 0 + epsilon
        const end = self._totalTime - epsilon

        // move state to finish
        self._state = finished
        // move time to the end
        self._time = self._rate >= 0 ? (self._fillB ? end : start) : self._fillF ? start : end
        // remove startTime since the "timer" isn't running
        self._startTime = _
        self.pending = false

        clearOnFinish(self)
        updateElement(self)
        // tslint:disable-next-line:no-unused-expression
        self.onfinish && self.onfinish()
    },
    play(this: IWebAnimation): void {
        const self = this
        updateTiming(self)

        const isForwards = self._rate >= 0
        let time = self._time === _ ? _ : Math.round(self._time)

        // prettier-ignore
        time = isForwards && (time === _ || time >= self._totalTime) ? 0
            : !isForwards && (time === _ || time <= 0)
                ? self._totalTime : time

        // update state as running
        self._state = running
        // ensure time is appropriate for a active state
        self._time = time
        // set starting time to now
        self._startTime = now()

        // update timing model
        scheduleOnFinish(self)
        updateElement(self)
    },
    pause(this: IWebAnimation): void {
        const self = this
        if (self._state === finished) {
            // pausing on finish should do nothing
            return
        }
        updateTiming(self)

        // ensure time is appropriate for a active state
        self._state = paused
        self._startTime = _

        clearOnFinish(self)
        updateElement(self)
    },
    reverse(this: IWebAnimation): void {
        this.playbackRate = this._rate * -1
    }
}

function clearOnFinish(self: IWebAnimation) {
    // clear last timeout
    // tslint:disable-next-line:no-unused-expression
    self._finishTaskId && clearTimeout(self._finishTaskId)
}
function updateElement(self: IWebAnimation) {
    const el = self._element
    const state = self._state

    // update element
    const style = el.style
    if (state === idle) {
        style.animationName = style.animationPlayState = style.animationDelay = ''
    } else {
        if (!isFinite(self._time)) {
            self._time = self._rate >= 0 ? 0 : self._totalTime
        }
        updateAnimation(self)
    }
}

function updateAnimation(self: IWebAnimation) {
    const { _state: s, _timing: t } = self
    const playState = s === finished || s === paused ? paused : s
    const delay = -toLocalTime(self)

    const animation =
        `${self._totalTime}ms` +
        ` ${t.easing}` +
        ` ${delay}ms` +
        ` ${t.iterations}` +
        ` ${t.direction}` +
        ` ${t.fill}` +
        ` ${playState}` +
        ` ${self.id}`

    const el = self._element
    const style = el.style

    /* The following statements work to force a repaint without flickering  */
    // store last visibility value so we can restore it after paint
    const lastVisibility = style.visibility

    // set visibility to hidden and remove animation attribute
    style.visibility = 'hidden'
    style.animation = style.webkitAnimation = ''

    // force a repaint
    // tslint:disable-next-line:no-unused-expression
    void el.offsetWidth

    // set new animation values
    style.animation = style.webkitAnimation = animation

    // restore visibility
    style.visibility = lastVisibility
}

function toLocalTime(self: IWebAnimation) {
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

function updateTiming(self: IWebAnimation) {
    const startTime = self._startTime
    const state = self._state

    if (!self.pending && state === running) {
        // mark as pending to prevent stack overflows from finish()
        self.pending = true

        let next = now()
        let time: number

        time = Math.round(self._time + (next - startTime))
        self._time = time
        self._startTime = next

        const isForwards = self._rate >= 0
        if ((isForwards && time >= self._totalTime) || (!isForwards && time <= 0)) {
            self.finish()
        }
        // unmark as pending
        self.pending = false
    }

    return self
}

function scheduleOnFinish(self: IWebAnimation) {
    if (self._state !== running) {
        // if the animation isn't running, there is no point in scheduling the finish
        return
    }

    // clear out existing finish timeout
    clearOnFinish(self)

    // recalculate time remaining and set a timeout for it
    const isForwards = self._rate >= 0
    const _remaining = isForwards ? self._totalTime - self._time : self._time
    self._finishTaskId = nextFrame(self.finish, _remaining)
}
