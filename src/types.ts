export type PlayState = 'idle' | 'running' | 'paused' | 'finished'
export interface IElementAnimate {
    (keyframes: IKeyframe[], timings: IEffectTiming): IAnimation
}

export interface IAnimation {
    currentTime: number
    playState: PlayState
    playbackRate: number

    cancel(): void
    finish(): void
    play(): void
    pause(): void
    reverse(): void
}

export interface IEffectTiming {
    direction?: string
    delay?: number
    duration?: number
    easing?: string
    endDelay?: number
    fill?: string
    iterationStart?: number
    iterations?: number
}

export interface IKeyframe {
    offset?: number
    easing?: string
    [val: string]: any
}

export interface ICSSKeyframe {
    'animation-timing-function'?: string
    [val: string]: string
}

export interface ICSSKeyframes {
    [offset: number]: ICSSKeyframe
}
