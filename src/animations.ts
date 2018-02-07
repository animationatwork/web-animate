export interface IHTMLElement2 extends HTMLElement {
    _animations: Record<string, IHTMLAnimation>
}

/**
 * Animation properties to set.  They start with a capital letter so no string manipulation is needed
 */
export interface IHTMLAnimation {
    Name: string
    Duration: string
    Delay: string
    IterationCount: string
    Direction: string
    FillMode: string
    PlayState: string
    TimingFunction: string
}

const ANIMATION_PROPS = [
    'Name',
    'Duration',
    'Delay',
    'IterationCount',
    'Direction',
    'FillMode',
    'PlayState',
    'TimingFunction'
]
const ANIMATION = 'animation'
const WEBKIT = 'webkitAnimation'
const MS = 'msAnimation'

// let taskId: any

export function enqueueElement(el: IHTMLElement2) {
    const animations = el._animations
    const style = el.style

    /* The following statements work to force a repaint without flickering  */
    // store last visibility value so we can restore it after paint
    const lastVisibility = style.visibility

    // set visibility to hidden
    style.visibility = 'hidden'

    // remove animation properties
    for (let i = 0, ilen = ANIMATION_PROPS.length; i < ilen; i++) {
        const key = ANIMATION_PROPS[i]
        style[ANIMATION + key] = style[WEBKIT + key] = style[MS + key] = ''
    }

    // force a repaint
    // tslint:disable-next-line:no-unused-expression
    void el.offsetWidth

    // set new animation values
    for (let i = 0, ilen = ANIMATION_PROPS.length; i < ilen; i++) {
        const key = ANIMATION_PROPS[i]
        let value: string
        for (let name in animations) {
            const animation = animations[name]
            if (animation) {
                value = (value ? ',' : '') + animation[key]
            }
        }
        style[ANIMATION + key] = style[WEBKIT + key] = style[MS + key] = value
    }

    // restore visibility
    style.visibility = lastVisibility
}
