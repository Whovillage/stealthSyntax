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

function encryptNames(sourceCode, anonMap) {
    let encryptedSourceCode = sourceCode;
    console.log(encryptedSourceCode)
    for (let key in anonMap) {
            encryptedSourceCode = encryptedSourceCode.split(key).join(anonMap[key]);
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