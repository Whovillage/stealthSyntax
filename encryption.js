const crypto = require('crypto');


function replaceNames(sourceCode, names, replacementNames) {
    let modifiedCode = sourceCode;
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const replacement = replacementNames[i];
        const regex = new RegExp('\\b' + name + '\\b', 'g');
        modifiedCode = modifiedCode.replace(regex, replacement);
    }
    return modifiedCode;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function encryptNames(sourceCode, anonMap) {
    console.log(anonMap);
    let encryptedSourceCode = sourceCode;
    for (let key in anonMap) {
        const escapedKey = escapeRegExp(key);
        const regex = new RegExp(escapedKey, 'g');
        encryptedSourceCode = encryptedSourceCode.replace(regex, anonMap[key]);
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