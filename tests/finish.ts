import { animate } from '../src/index'
import { IEffectTiming } from '../src/types'

test('finish() from idle', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.cancel()
    player.finish()

    expect(Math.round(player.currentTime)).toEqual(0)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('finish() from paused', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.pause()
    player.currentTime = 50
    player.finish()

    expect(Math.round(player.currentTime)).toEqual(0)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('finish() from finished', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const timing: IEffectTiming = { duration: 100 }
    const player = animate(el, keyframes, timing)
    player.finish()
    player.finish()

    expect(Math.round(player.currentTime)).toBe(0)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('finish() from finished (fill: forwards)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const timing: IEffectTiming = { duration: 100, fill: 'forwards' }
    const player = animate(el, keyframes, timing)
    player.finish()
    player.finish()

    expect(Math.round(player.currentTime)).toBe(100)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('finish() from finished (fill: both)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const timing: IEffectTiming = { duration: 100, fill: 'both' }
    const player = animate(el, keyframes, timing)
    player.finish()
    player.finish()

    expect(Math.round(player.currentTime)).toBe(100)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('finish() from running', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.currentTime = 50
    player.finish()

    expect(player.currentTime).toBe(0)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})
