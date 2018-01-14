import { IKeyframe, IEffectTiming, IAnimation, PlayState } from './types'
import { waapiToString } from './waapiToString'
import { insertKeyframes } from './styles'
import { _ } from './constants'

/**
 * Animate
 */
export class EdgeAnimation implements IAnimation {
    public get currentTime(): number {
        return this._update()._time
    }
    public set currentTime(val: number) {
        this._time = val
        this._update()
    }
    public get playbackRate(): number {
        return this._update()._rate
    }
    public set playbackRate(val: number) {
        this._rate = val
        this._update()
    }
    public get playState(): PlayState {
        return this._update()._state
    }
    public oncancel: Function
    public onfinish: Function
    public id: string
    public pending: boolean
    private _time: number
    private _totalTime: number
    private _last: number
    private _element: HTMLElement
    private _timing: IEffectTiming
    private _rate: number
    private _state: PlayState
    private _yoyo: boolean
    private _reverse: boolean
    private _finishTaskId: any
    private _isFillForwards: boolean
    private _isFillBackwards: boolean

    constructor(element: HTMLElement, keyframes: IKeyframe[], timing: IEffectTiming) {
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

        const self = this
        self._element = element
        self._rate = 1
        self.pending = false

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
        style.animationDuration = timing.duration + 'ms'
        style.animationIterationCount = timing.iterations === Infinity ? 'infinite' : timing.iterations + ''
        style.animationDirection = timing.direction
        style.animationFillMode = timing.fill

        // calculate total time and set timing
        self._timing = timing
        self._totalTime = (timing.delay || 0) + timing.duration * timing.iterations + (timing.endDelay || 0)

        // calculate direction
        self._yoyo = timing.direction.indexOf('alternate') !== -1
        self._reverse = timing.direction.indexOf('reverse') !== -1

        // start playing
        self.play()
    }

    public cancel(): void {
        const self = this
        self._time = self._last = _
        self._update()
        self._clearFinish()
        // tslint:disable-next-line:no-unused-expression
        self.oncancel && self.oncancel()
    }
    public finish = (): void => {
        const self = this
        self._time = self._rate >= 0 ? self._totalTime : 0
        if (self._state !== 'finished') {
            self._update()
        }
        self._clearFinish()
        // tslint:disable-next-line:no-unused-expression
        self.onfinish && self.onfinish()
    }
    public play(): void {
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
        self._update()
    }
    public pause(): void {
        const self = this
        self._last = _
        self._update()
    }
    public reverse(): void {
        const self = this
        self._rate *= -1
        self._update()
    }
    private _clearFinish() {
        const self = this
        if (self._finishTaskId) {
            // clear last timeout
            clearTimeout(self._finishTaskId)
        }
    }
    private _updateElement() {
        const self = this
        const el = self._element
        const state = self._state

        // update element
        const style = el.style
        if (state === 'idle') {
            style.animationName = style.animationPlayState = style.animationDelay = ''
        } else {
            style.animationName = ''
            // tslint:disable-next-line:no-unused-expression
            void el.offsetWidth

            style.animationDelay = -self._localTime() + 'ms'
            style.animationPlayState = state === 'finished' || state === 'paused' ? 'paused' : state
            style.animationName = self.id

            console.log(-self._localTime() + 'ms', state, self.id)
        }
    }
    private _localTime() {
        const self = this
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
    private _update() {
        const self = this

        let playState: PlayState
        let time = self._time
        let last = self._last
        if (time === _) {
            playState = 'idle'
        } else if (last === _) {
            playState = 'paused'
        } else {
            const next = performance.now()
            const delta = next - last
            last = next
            time += delta

            const isForwards = self._rate >= 0
            if ((isForwards && time >= self._totalTime) || (!isForwards && time <= 0)) {
                playState = 'finished'
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
        self._updateElement()
        self._updateSchedule()
        return self
    }
    private _updateSchedule() {
        const self = this
        self._clearFinish()

        // recalculate time remaining and set a timeout for it
        const isForwards = self._rate >= 0
        const _remaining = isForwards ? self._totalTime - self._time : self._time
        self._finishTaskId = setTimeout(self.finish, _remaining)
    }
}
