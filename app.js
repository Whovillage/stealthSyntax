const fs = require('fs');
const crypto = require('crypto');
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const Python = require('tree-sitter-python');
const {encryptNames, decryptNames} = require('./encryption');

const EXAMPLE_DIR = "examples"

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
        const paramsNode = fnNode.namedChild(1);

        return {
            name: nameNode.text,
            params: paramsNode ? paramsNode.children.filter((child) => child.type === 'identifier').map((paramNode) => paramNode.text) : []
        };
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

function extractComments(node, language) {
    const commentNodeTypes = language === 'JavaScript'
        ? ['line_comment', 'block_comment']
        : ['comment'];

    const commentNodes = commentNodeTypes.flatMap((type) => node.descendantsOfType(type));

    return commentNodes
        .map((commentNode) => {
            const text = commentNode.text;
            if (text.startsWith('//')) {
                return text.slice(2).trim();
            }
            return text;
        })
        .filter((text) => text !== null);
}


function extractSqlQueries(node) {
    const sourceCode = node.text;
    const sqlPattern = /(["'`])(SELECT|INSERT|UPDATE|DELETE)(.|\n)*?\1/gi;
    const queries = sourceCode.match(sqlPattern) || [];

    const parsedQueries = queries.map(query => {
        const insertPattern = /INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i;
        const selectPattern = /SELECT\s+(.+)\s+FROM\s+([a-zA-Z0-9_]+)(.|\n)*?;/i;
        const updatePattern = /UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+)/i;
        const deletePattern = /DELETE\s+FROM\s+([a-zA-Z0-9_]+)(.|\n)*?;/i;

        let insertMatch = query.match(insertPattern);
        let selectMatch = query.match(selectPattern);
        let updateMatch = query.match(updatePattern);
        let deleteMatch = query.match(deletePattern);

        if (insertMatch) {
            const tableName = insertMatch[1];
            const columnNamesString = insertMatch[2];
            const columnNames = columnNamesString.split(',').map(column => column.trim());
            return {
                tableName,
                columnNames,
            };
        }

        if (selectMatch) {
            const columnNamesString = selectMatch[1];
            const tableName = selectMatch[2];
            const columnNames = columnNamesString.split(',').map(column => column.trim());
            return {
                tableName,
                columnNames,
            };
        }

        if (updateMatch) {
            const tableName = updateMatch[1];
            const setClause = updateMatch[2];
            return {
                tableName,
                setClause,
            };
        }

        if (deleteMatch) {
            const tableName = deleteMatch[1];
            return {
                tableName,
            };
        }

        return {};
    });

    return parsedQueries;
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
    const sqlQueries = extractSqlQueries(rootNode);
    const comments = extractComments(rootNode);

    return {
        sourceCode,
        sqlQueries,
        functionNames,
        constants,
        jsonObjects,
        variables,
        comments
    };
}

const createAnonMap = (extractedNames) => {
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

function objectToArray(object) {
    const {sourceCode} = object;
    delete object.sourceCode;
    const values = Object.values(object).flat(Infinity);
    const result = [];

    function extractValues(item) {
        if (Array.isArray(item)) {
            item.forEach(extractValues);
        } else if (typeof item === 'object') {
            Object.values(item).forEach(extractValues);
        } else {
            result.push(item);
        }
    }

    values.forEach(extractValues);

    return {result, sourceCode};
}

const {sourceCode, result} = objectToArray(parsedResult);
console.log(result)
let anonMap = createAnonMap(result)
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

module.exports = {decryptedSourceCode}