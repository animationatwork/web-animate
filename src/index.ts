import { IElementAnimate, IKeyframe, IEffectTiming, IAnimation, ICSSKeyframes, ICSSKeyframe, PlayState } from './types'
import { clearTimeout } from 'timers'

const _ = undefined as undefined
const upperCasePattern = /[A-Z]/g
const propLower = (m: string) => `-${m.toLowerCase()}`
const msPattern = /^ms-/
const allKeyframes: Record<string, string> = {}

let taskId: any
let styleElement: HTMLStyleElement

/**
 * Schedules next render of styles
 */
function renderStyles() {
    taskId = taskId || setTimeout(renderStylesheet, 0)
}

/**
 * Writes out new keyframes to the stylesheet
 */
function renderStylesheet() {
    taskId = 0
    if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.setAttribute('rel', 'stylesheet')
        document.head.appendChild(styleElement)
    }

    let contents = ''
    for (let key in allKeyframes) {
        contents += '@keyframes ' + key + '{' + allKeyframes[key] + '}'
    }
    styleElement.innerHTML = contents
}

/**
 * Inserts the keyframes into the stylesheet
 * @param keyframes frames to insert into stylesheet
 */
function insertKeyframes(keyframes: IKeyframe[]) {
    const rules = framesToString(waapiToKeyframes(keyframes))
    const hash = 'ea_' + stringHash(rules)
    if (!allKeyframes[hash]) {
        // signal re-render
        allKeyframes[hash] = rules
        renderStyles()
    }
    return hash
}

/**
 * Generate a hash value from a string.
 */
function stringHash(str: string): string {
    // borrowed from free-style
    let value = 5381
    let len = str.length
    while (len--) {
        value = (value * 33) ^ str.charCodeAt(len)
    }
    return (value >>> 0).toString(36)
}

/**
 * Transforms a camelcase property name to a hyphenated one
 * @param propertyName camelcase string to transform to hyphenated
 */
function hyphenate(propertyName: string): string {
    return (
        propertyName
            .replace(upperCasePattern, propLower)
            // note: Internet Explorer vendor prefix.
            .replace(msPattern, '-ms-')
    )
}

/**
 * Transforms WAAPI keyframes [] to a collapsed frames dictionary
 * @param keyframes
 */
function waapiToKeyframes(keyframes: IKeyframe[]) {
    const results = {}
    for (let i = 0, ilen = keyframes.length; i < ilen; i++) {
        const keyframe = keyframes[i]
        const offset = keyframe.offset
        const target = results[offset] || (results[offset] = {})
        for (let key in keyframe) {
            let newKey = key
            if (key === 'easing') {
                newKey = 'animation-timing-function'
            }
            if (key !== 'offset') {
                target[newKey] = keyframe[key]
            }
        }
    }
    return results
}

/**
 * Converts a keyframes dictionary to a string
 * @param keyframes frames dictionary to convert to a string
 */
function framesToString(keyframes: ICSSKeyframes) {
    const keys = Object.keys(keyframes).sort()
    const ilen = keys.length
    const rules: string[] = Array(ilen)
    for (let i = 0; i < ilen; i++) {
        let key = keys[i]
        rules[i] = +key * 100 + '%{' + propsToString(keyframes[key]) + '}'
    }
    return rules.join('\n')
}

/**
 * Transforms a keyframe object into a string representation
 * @param keyframe to transform to string
 */
function propsToString(keyframe: ICSSKeyframe) {
    const rules: string[] = []
    for (let key in keyframe) {
        let value = keyframe[key]
        if (value !== null && value !== _) {
            rules.push(hyphenate(key.trim()) + ':' + value)
        }
    }
    return rules.sort().join(';')
}

/**
 * Animate
 */
class EdgeAnimation implements IAnimation {
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

    constructor(element: HTMLElement, keyframes: IKeyframe[], timing: IEffectTiming) {
        // set default timings
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

        const self = this
        self._element = element
        self._rate = 1
        self.pending = false

        // insert animation definition
        const animationName = insertKeyframes(keyframes)
        self.id = animationName

        // set initial animation state on element
        const style = element.style
        style.animation = `${timing.duration}ms ${timing.easing} ${timing.delay}ms ${timing.iterations} ${
            timing.direction
        } ${timing.fill} ${animationName}`

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
        // tslint:disable-next-line:no-unused-expression
        self.oncancel && self.oncancel()
    }
    public finish(): void {
        const self = this
        self._time = self._rate >= 0 ? self._totalTime : 0
        self._update()
        // tslint:disable-next-line:no-unused-expression
        self._finish()
    }
    public play(): void {
        const self = this

        // update time if applicable
        const isForwards = self._rate >= 0
        const isCanceled = self._time === _
        if ((isForwards && isCanceled) || self._time === self._totalTime) {
            self._time = 0
        } else if ((!isForwards && isCanceled) || self._time === 0) {
            self._time = self._totalTime
        }

        self._last = performance.now()
        self._time = self._last
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
    private _finish = () => {
        const self = this
        self._clearFinish()

        // tslint:disable-next-line:no-unused-expression
        self.onfinish && self.onfinish()
    }
    private _updateElement() {
        const self = this
        const el = self._element
        const timing = self._timing
        const style = el.style

        const ps = self._state
        const playState = ps === 'finished' || ps === 'paused' ? 'paused' : ps === 'running' ? 'running' : ''

        // get progression on this iteration
        const timeLessDelay = self._time - (timing.delay + timing.endDelay)
        let localTime = timeLessDelay % timing.duration
        const iteration = Math.floor(timeLessDelay / timing.duration)

        if (self._reverse) {
            // reverse if reversed
            localTime = self._timing.duration - localTime
        }
        if (self._yoyo && !(iteration % 2)) {
            // reverse if alternated and on an odd iteration
            localTime = self._timing.duration - localTime
        }

        // update element
        // todo: figure out how to support multiple animations on an element
        // style.animationName = playState ? self._hash : ''
        style.animationPlayState = playState
        style.animationDelay = -localTime + 'ms'
    }
    private _update() {
        const self = this

        let playState: PlayState
        let time = self._time
        if (self._time === _) {
            playState = 'idle'
        } else if (self._last === _) {
            playState = 'paused'
        } else {
            const delta = performance.now() - self._last
            time += delta

            if (self._time > self._totalTime) {
                playState = 'finished'
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
        const isForwards = self._rate <= 0
        const _remaining = isForwards ? self._totalTime - self._time : self._time
        self._finishTaskId = setTimeout(self._finish, _remaining)
    }
}

declare global {
    // tslint:disable-next-line:interface-name
    interface Element {
        animate: IElementAnimate
    }
}

// polyfill older browsers
if (typeof Element.prototype.animate !== 'undefined') {
    Element.prototype.animate = function(keyframes: IKeyframe[], timings: IEffectTiming): IAnimation {
        return animate(this, keyframes, timings)
    }
}

export function animate(el: Element, keyframes: IKeyframe[], timings: IEffectTiming): IAnimation {
    return new EdgeAnimation(el as HTMLElement, keyframes, timings)
}
