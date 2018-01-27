let sheet: CSSStyleSheet
const rulesAdded = {}

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
    if (!rulesAdded[hash]) {
        rulesAdded[hash] = 1

        if (!sheet) {
            const styleElement = document.createElement('style')
            styleElement.setAttribute('rel', 'stylesheet')
            document.head.appendChild(styleElement)
            sheet = styleElement.sheet as CSSStyleSheet
        }

        // insert rule
        sheet.insertRule(`@keyframes ${hash}{${rules}}`, sheet.cssRules.length)
    }
    return hash
}
