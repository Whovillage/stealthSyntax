function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// function encryptNames(sourceCode, anonMap) {
//     console.log(anonMap)
//     let encryptedSourceCode = sourceCode;
//     for (let key in anonMap) {
//         const escapedKey = escapeRegExp(key);
//         const regex = new RegExp(escapedKey, 'g');
//         encryptedSourceCode = encryptedSourceCode.replace(regex, anonMap[key]);
//     }
//
//     return encryptedSourceCode;
// }


function sortAnonMapByLength(anonMap) {
    const sortedKeys = Object.keys(anonMap).sort((a, b) => b.length - a.length);
    const sortedAnonMap = {};

    for (const key of sortedKeys) {
        sortedAnonMap[key] = anonMap[key];
    }

    return sortedAnonMap;
}

RegExp.escape = function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function encryptNames(sourceCode, anonMap) {
    anonMap = sortAnonMapByLength(anonMap)
    let encryptedSourceCode = sourceCode;

    for (const key in anonMap) {
        const value = anonMap[key];
        const escapedKey = RegExp.escape(key);
        const regex = new RegExp('(?<![a-zA-Z0-9_])' + escapedKey + '(?![a-zA-Z0-9_])', 'g');
        encryptedSourceCode = encryptedSourceCode.replace(regex, value);
    }

    return encryptedSourceCode;
}


function decryptNames(encryptedSourceCode, anonMap) {
    let decryptedSourceCode = encryptedSourceCode;
    for (let key in anonMap) {
        decryptedSourceCode = decryptedSourceCode.split(anonMap[key]).join(key);
    }

    return decryptedSourceCode;
}

module.exports = {
    encryptNames,
    decryptNames
}