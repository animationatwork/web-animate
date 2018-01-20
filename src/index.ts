import { IElementAnimate, IEffectTiming, IAnimation, IKeyframe } from './types';
import { Animation } from './Animation';
import { forceRender } from './styles';

declare global {
    // tslint:disable-next-line:interface-name
    interface Element {
        animate: IElementAnimate
    }
}

// pass force render outward
export { forceRender }

export let isPolyflled = false

export function polyfill() {
    isPolyflled = true
    Element.prototype.animate = function (keyframes: IKeyframe[], timings: IEffectTiming): IAnimation {
        return new (Animation as any)(this as HTMLElement, keyframes, timings)
    }
}

// polyfill older browsers automatically
if (typeof Element.prototype.animate !== 'undefined') {
    polyfill()
}
