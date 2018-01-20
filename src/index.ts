import { IElementAnimate, IEffectTiming, IAnimation, IKeyframe } from './types'
import { Animation } from './Animation'
export { forceRender } from './styles'

declare global {
    // tslint:disable-next-line:interface-name
    interface Element {
        animate: IElementAnimate
    }
}

function animateElement(keyframes: IKeyframe[], timings: IEffectTiming): IAnimation {
    return new (Animation as any)(this as HTMLElement, keyframes, timings)
}


export function animate(el: Element, keyframes: IKeyframe[], timings: IEffectTiming) {
    return animateElement.call(el, keyframes, timings)
}

export function polyfill() {
    Element.prototype.animate = animateElement
}

export function isPolyflled() {
    return Element.prototype.animate === animateElement
}

// polyfill older browsers automatically
if (typeof Element.prototype.animate !== 'undefined') {
    polyfill()
}
