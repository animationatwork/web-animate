import { IKeyframe, ICSSKeyframe } from './types'
import { _, upperCasePattern, propLower, msPattern } from './constants'

/**
 * Transforms a camelcase property name to a hyphenated one
 * @param propertyName camelcase string to transform to hyphenated
 */
function hyphenate(propertyName: string): string {
    return (
        propertyName
            .replace(upperCasePattern, propLower)
            // note: Internet Explorer vendor prefix.
            .replace(msPattern, '-ms-')
    )
}

/**
 * Transforms a keyframe object into a string representation
 * @param keyframe to transform to string
 */
function propsToString(keyframe: ICSSKeyframe) {
    const rules: string[] = []
    for (let key in keyframe) {
        let value = keyframe[key]
        if (value !== null && value !== _) {
            rules.push(hyphenate(key.trim()) + ':' + value)
        }
    }
    return rules.sort().join(';')
}

export function waapiToString(keyframes: IKeyframe[]) {
    /** Transforms WAAPI keyframes [] to a collapsed frames dictionary */
    const frames = {}
    for (let i = 0, ilen = keyframes.length; i < ilen; i++) {
        const keyframe = keyframes[i]
        const offset = keyframe.offset
        const target = frames[offset] || (frames[offset] = {})
        for (let key in keyframe) {
            let newKey = key
            if (key === 'easing') {
                newKey = 'animation-timing-function'
            }
            if (key !== 'offset') {
                target[newKey] = keyframe[key]
            }
        }
    }

    /** framesToString */
    const keys = Object.keys(frames).sort()
    const jlen = keys.length
    const rules: string[] = Array(jlen)
    for (let j = 0; j < jlen; j++) {
        let key = keys[j]
        rules[j] = +key * 100 + '%{' + propsToString(frames[key]) + '}'
    }
    return rules.join('\n')
}
