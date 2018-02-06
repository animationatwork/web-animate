import { animate } from '../../src/index'
import { IEffectTiming } from '../../src/types';

test('play() from idle', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.cancel()
    player.play()

    expect(player.currentTime).toEqual(0)
    expect(player.playState).toEqual('running')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('play() from paused', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.pause()
    player.currentTime = 50
    player.play()

    expect(player.currentTime).toEqual(50)
    expect(player.playState).toEqual('running')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('play() from finished', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.finish()
    player.play()

    expect(player.currentTime).toEqual(0)
    expect(player.playState).toEqual('running')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('play() from running', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.currentTime = 50
    player.play()

    expect(player.currentTime).toEqual(50)
    expect(player.playState).toEqual('running')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})
