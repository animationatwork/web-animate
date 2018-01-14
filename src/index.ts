import { IElementAnimate, IEffectTiming, IAnimation, IKeyframe } from './types';
import { EdgeAnimation } from './EdgeAnimation';

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
