import { IElementAnimate, IEffectTiming, IAnimation, IKeyframe } from './types'
import { Animation } from './Animation'

declare global {
    // tslint:disable-next-line:interface-name
    interface Element {
        animate: IElementAnimate
    }
}

function animateElement(keyframes: IKeyframe[], timingOrDuration: IEffectTiming | number): IAnimation {
    return new (Animation as any)(this as HTMLElement, keyframes, timingOrDuration)
}

export function animate(el: Element, keyframes: IKeyframe[], duration: number): IAnimation
export function animate(el: Element, keyframes: IKeyframe[], timing: IEffectTiming): IAnimation
export function animate(el: Element, keyframes: IKeyframe[], timingOrDuration: IEffectTiming | number): IAnimation {
    return animateElement.call(el, keyframes, timingOrDuration)
}

export function polyfill() {
    Element.prototype.animate = animateElement
}

export function isPolyfilled() {
    return Element.prototype.animate === animateElement
}

// polyfill older browsers automatically
if (typeof Element.prototype.animate === 'undefined') {
    polyfill()
}
