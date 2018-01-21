import { animate } from '../src/index'
import { IEffectTiming } from '../src/types';

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

test('pause() from running', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.currentTime = 50
    player.pause()

    expect(player.currentTime).toEqual(50)
    expect(player.playState).toEqual('paused')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('pause() from idle', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.cancel()
    player.pause()

    expect(player.currentTime).toEqual(0)
    expect(player.playState).toEqual('paused')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('pause() from paused', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.pause()
    player.currentTime = 50
    player.pause()

    expect(player.currentTime).toEqual(50)
    expect(player.playState).toEqual('paused')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('pause() from finished', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const timing: IEffectTiming = { duration: 100, fill: 'forwards' }
    const player = animate(el, keyframes, timing)
    player.finish()
    player.pause()

    expect(Math.round(player.currentTime)).toBe(100)
    expect(player.playState).toEqual('finished')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

test('pause() from running', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const keyframes = [{ opacity: 0 }, { opacity: 1 }]
    const player = animate(el, keyframes, 100)
    player.currentTime = 50
    player.pause()

    expect(player.currentTime).toBe(50)
    expect(player.playState).toEqual('paused')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})

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
    const timing: IEffectTiming = { duration: 100, fill: 'forwards' }
    const player = animate(el, keyframes, timing)
    player.finish()
    player.pause()

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
    player.pause()

    expect(player.currentTime).toBe(50)
    expect(player.playState).toEqual('paused')
    expect(player.playbackRate).toEqual(1)
    expect(player.pending).toEqual(false)
    expect(player.id).toBeTruthy()
})



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
