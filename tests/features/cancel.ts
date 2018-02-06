import { animate } from '../../src/index'
import { IEffectTiming } from '../../src/types';

test('cancel() from idle', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.cancel()
    player.cancel()

    // tslint:disable-next-line:no-null-keyword
    expect(player.currentTime).toEqual(null)
    expect(player.playState).toEqual('idle')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('cancel() from paused', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.pause()
    player.currentTime = 50
    player.cancel()

    // tslint:disable-next-line:no-null-keyword
    expect(player.currentTime).toEqual(null)
    expect(player.playState).toEqual('idle')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('cancel() from finished', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const timing: IEffectTiming = { duration: 100, fill: 'forwards' }
    const player = animate(el, keyframes, timing)
    player.finish()
    player.cancel()

    // tslint:disable-next-line:no-null-keyword
    expect(player.currentTime).toEqual(null)
    expect(player.playState).toEqual('idle')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('cancel() from running', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.currentTime = 50
    player.cancel()

    // tslint:disable-next-line:no-null-keyword
    expect(player.currentTime).toEqual(null)
    expect(player.playState).toEqual('idle')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})
