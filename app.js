const fs = require('fs');
const crypto = require('crypto');
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const Python = require('tree-sitter-python');
const {encryptNames, decryptNames} = require('./encryption');

const EXAMPLE_DIR = "examples"

// A mapping of file extensions to Tree-sitter language grammars
const languageByExtension = {
    '.js': JavaScript,
    '.py': Python,
};

function extractFunctionNames(node, language) {
    const targetNodeTypes = language === JavaScript
        ? ['function_declaration', 'function_expression']
        : ['function_definition'];

    const functionNodes = targetNodeTypes.flatMap((type) => node.descendantsOfType(type));

    return functionNodes.map((fnNode) => {
        const nameNode = fnNode.namedChild(0);
        return nameNode.text;
    });
}

function extractVariables(node, language) {
    const variableNodeTypes = language === JavaScript
        ? ['variable_declarator']
        : ['assignment'];

    const variableNodes = variableNodeTypes.flatMap((type) => node.descendantsOfType(type));

    return variableNodes
        .map((varNode) => {
            const nameNode = varNode.namedChild(0);
            return nameNode ? nameNode.text : null;
        })
        .filter((name) => name !== null);
}

function extractConstants(node, language) {
    const constantNodeTypes = language === JavaScript
        ? ['const']
        : ['assignment'];

    const constantNodes = constantNodeTypes.flatMap((type) => node.descendantsOfType(type));

    return constantNodes
        .map((constNode) => {
            const nameNode = constNode.namedChild(0);
            return nameNode ? nameNode.text : null;
        })
        .filter((name) => name !== null);
}


function extractJSONObjects(node) {
    const jsonObjectNodes = node.descendantsOfType('object');

    return jsonObjectNodes.map((objNode) => {
        const obj = {};

        objNode.children.forEach((child) => {
            if (child.type === 'pair') {
                const keyNode = child.namedChild(0);
                const valueNode = child.namedChild(1);
                obj[keyNode.text] = valueNode.text;
            }
        });

        return obj;
    });
}

function parseSourceCode(filePath) {
    const fileExtension = filePath.slice(filePath.lastIndexOf('.'));
    const language = languageByExtension[fileExtension];

    if (!language) {
        console.error(`Unsupported file extension: ${fileExtension}`);
        return;
    }

    const parser = new Parser();
    parser.setLanguage(language);
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    const tree = parser.parse(sourceCode);
    const rootNode = tree.rootNode;

    const functionNames = extractFunctionNames(rootNode, language);
    const constants = extractConstants(rootNode, language);
    const jsonObjects = extractJSONObjects(rootNode);
    const variables = extractVariables(rootNode, language);

    return {
        sourceCode,
        functionNames,
        constants,
        jsonObjects,
        variables,
    };
}

const createAnonMap = (extractednames) => {
    let anonMap = {}
    for (name of extractedNames) {
        let anon = crypto.randomBytes(4).toString("hex");
        anonMap[name] = anon
    }
    return anonMap
}

// Example usage
const jsFile = `${EXAMPLE_DIR}/example.js`;
// const pythonFile = `${EXAMPLE_DIR}/example.py`;

const parsedResult = parseSourceCode(jsFile);
console.log(`Function names in JavaScript file: ${jsFile}`);
//console.log(parsedResult);

const sourceCode = parsedResult.sourceCode;
const extractedNames = parsedResult.functionNames.concat(parsedResult.constants, parsedResult.variables);

let anonMap = createAnonMap(extractedNames)

console.log(anonMap)

const encryptedSourceCode = encryptNames(sourceCode, anonMap);
fs.writeFile('encrypted_source_code.txt', encryptedSourceCode, (err) => {
    if (err) throw err;
    console.log('Encrypted source code saved to encrypted_source_code.txt');
});

const decryptedSourceCode = decryptNames(encryptedSourceCode, anonMap);
fs.writeFile('decrypted_source_code.txt', decryptedSourceCode, (err) => {
    if (err) throw err;
    console.log('Decrypted source code saved to decrypted_source_code.txt');
});

module.exports = { decryptedSourceCode}