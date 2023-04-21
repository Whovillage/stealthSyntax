const crypto = require('crypto');


function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted;
}

function decrypt(text, key) {
    const iv = Buffer.from(text.slice(0, 32), 'hex');
    const encryptedText = text.slice(32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

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

function encryptNames(sourceCode, names, key) {
    let encryptedSourceCode = sourceCode;
    names.forEach((name) => {
        const encryptedName = encrypt(name, key);
        encryptedSourceCode = encryptedSourceCode.split(name).join(encryptedName);
    });

    return encryptedSourceCode;
}

function decryptNames(encryptedSourceCode, encryptedNames, key) {
    let decryptedSourceCode = encryptedSourceCode;
    encryptedNames.forEach((encryptedName) => {
        const decryptedName = decrypt(encryptedName, key);
        decryptedSourceCode = decryptedSourceCode.split(encryptedName).join(decryptedName);
    });

    return decryptedSourceCode;
}


module.exports = {
    encrypt,
    encryptNames,
    decryptNames
}