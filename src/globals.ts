// tslint:disable-next-line:no-var-keyword
var global = window || global

let lastTime: number
let taskId: any

/**
 * Resets the time so it can be calculated next time it is accessed
 */
function resetTime() {
    lastTime = 0
    taskId = 0
}

/**
 * Syncs the current time for a given frame
 */
export function now(): number {
    taskId = taskId || nextFrame(resetTime)
    return (lastTime = lastTime || (global.performance || Date).now())
}

/**
 * A wrapper for setTimeout (for minification purposes)
 * @param fn to delay
 */
export const nextFrame = (fn: Function, time?: number) => setTimeout(fn, time || 0)
