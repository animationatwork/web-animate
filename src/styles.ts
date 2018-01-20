const allKeyframes: Record<string, string> = {}

let taskId: any
let styleElement: HTMLStyleElement

/**
 * Schedules next render of styles
 */
function renderStyles() {
    taskId = taskId || setTimeout(forceRender, 0)
}

/**
 * Writes out new keyframes to the stylesheet
 */
export function forceRender() {
    taskId = 0
    if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.setAttribute('rel', 'stylesheet')
        document.head.appendChild(styleElement)
    }

    let contents = ''
    for (let key in allKeyframes) {
        contents += '@keyframes ' + key + '{' + allKeyframes[key] + '}'
    }
    styleElement.innerHTML = contents
}

/**
 * Generate a hash value from a string.
 */
function stringHash(str: string): string {
    // borrowed from free-style
    let value = 5381
    let len = str.length
    while (len--) {
        value = (value * 33) ^ str.charCodeAt(len)
    }
    return (value >>> 0).toString(36)
}

/**
 * Inserts the keyframes into the stylesheet
 * @param keyframes frames to insert into stylesheet
 */
export function insertKeyframes(rules: string) {
    const hash = 'ea_' + stringHash(rules)
    if (!allKeyframes[hash]) {
        // signal re-render
        allKeyframes[hash] = rules
        renderStyles()
    }
    return hash
}
