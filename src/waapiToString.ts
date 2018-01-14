import { IKeyframe, ICSSKeyframes, ICSSKeyframe } from './types'
import { _, upperCasePattern, propLower, msPattern } from './constants';

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
 * Transforms WAAPI keyframes [] to a collapsed frames dictionary
 * @param keyframes
 */
function waapiToKeyframes(keyframes: IKeyframe[]) {
    const results = {}
    for (let i = 0, ilen = keyframes.length; i < ilen; i++) {
        const keyframe = keyframes[i]
        const offset = keyframe.offset
        const target = results[offset] || (results[offset] = {})
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
    return results
}

/**
 * Converts a keyframes dictionary to a string
 * @param keyframes frames dictionary to convert to a string
 */
function framesToString(keyframes: ICSSKeyframes) {
    const keys = Object.keys(keyframes).sort()
    const ilen = keys.length
    const rules: string[] = Array(ilen)
    for (let i = 0; i < ilen; i++) {
        let key = keys[i]
        rules[i] = +key * 100 + '%{' + propsToString(keyframes[key]) + '}'
    }
    return rules.join('\n')
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
    return framesToString(waapiToKeyframes(keyframes))
}
