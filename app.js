const fs = require('fs');
const crypto = require('crypto');
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const {encryptNames, decryptNames} = require('./encryption');
const {Parser: nodeParser} = require('node-sql-parser');


const EXAMPLE_DIR = "examples"

const languageByExtension = {
    '.js': JavaScript,
};

function extractFunctionNames(node, language) {
    const targetNodeTypes =
        language === JavaScript
            ? [
                'function_declaration',
                'function_expression',
                'method_definition',
            ]
            : [];

    const functionNodes = targetNodeTypes.flatMap((type) =>
        node.descendantsOfType(type)
            .filter((node) => targetNodeTypes.includes(node.type))
            .filter((node) => !['async', 'constructor'].includes(node.text))
    );

    return functionNodes.map((fnNode) => {
        const nameNode =
            fnNode.type === 'method_definition'
                ? fnNode.namedChild(1) && fnNode.namedChild(0).text !== 'async' ? fnNode.namedChild(1) : fnNode.namedChild(2)
                : fnNode.namedChild(0);
        const paramsNode = fnNode.namedChild(1);

        return {
            name: nameNode.text,
            params: paramsNode
                ? paramsNode.children
                    .filter((child) => child.type === 'identifier')
                    .map((paramNode) => paramNode.text)
                : [],
        };
    });
}

function extractClassAndMethodNames(node, language) {
    const targetNodeTypes =
        language === JavaScript
            ? [
                'class_declaration',
                'method_definition',
            ]
            : [];

    const classNodes = targetNodeTypes.flatMap((type) =>
        node.descendantsOfType(type)
    );

    const classNames = classNodes.map((classNode) => {
        const classNameNode = classNode.namedChild(0);
        const methodNodes = classNode.descendantsOfType('method_definition');

        const methodNames = methodNodes.map((methodNode) => {
            const methodNameNode = methodNode.namedChild(0);
            return methodNameNode.text;
        });

        return {
            name: classNameNode.text,
            methods: methodNames,
        };
    });

    return classNames;
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
        .filter((name) => name !== null && !['async', 'constructor'].includes(name));
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
        .filter((name) => name !== null && !['async', 'constructor'].includes(name));
}

function extractCustomConstants(node) {
    const sourceCode = node.text;
    const customConstantPattern = /const\s+([a-zA-Z0-9_]+)\s*=\s*["'](.*)["']/g;
    const matches = sourceCode.matchAll(customConstantPattern);
    const customConstants = [];

    for (const match of matches) {
        customConstants.push({
            name: match[1],
            value: match[2]
        });
    }

    return customConstants;
}


function extractNamesAndValues(node, language) {
    const variableNodeTypes = language === JavaScript ? ['variable_declarator', 'const_declaration'] : ['assignment'];
    const constantNodeTypes = language === JavaScript ? ['const', 'const_declaration'] : ['assignment'];
    const variableNodes = variableNodeTypes.flatMap((type) => node.descendantsOfType(type));
    const constantNodes = constantNodeTypes.flatMap((type) => node.descendantsOfType(type));

    const namesAndValues = [...variableNodes, ...constantNodes]
        .map((varOrConstNode) => {
            const nameNode = varOrConstNode.namedChild(0);
            let valueNode;
            if (varOrConstNode.type === 'const_declaration') {
                const nameText = nameNode.text;
                const valuePattern = new RegExp(`const ${nameText} =\\s*["'](.*)["']`);
                const valueMatch = node.text.match(valuePattern);
                if (valueMatch) {
                    valueNode = { text: valueMatch[1] };
                }
            } else {
                valueNode = varOrConstNode.namedChild(2);
            }
            return nameNode ? { name: nameNode.text, value: valueNode ? valueNode.text : null } : null;
        })
        .filter((varOrConst) => varOrConst !== null && !['async', 'constructor'].includes(varOrConst.name));

    return namesAndValues;
}



function extractJSONObjects(node) {
    const jsonObjectNodes = node.descendantsOfType('object');
    const result = [];

    jsonObjectNodes.forEach((objNode) => {
        objNode.children.forEach((child) => {
            if (child.type === 'pair') {
                const keyNode = child.namedChild(0);
                const valueNode = child.namedChild(1);
                result.push(keyNode.text);
                result.push(valueNode.text);
            }
        });
    });
    return result;
}

function extractComments(node, language) {
    const commentNodeTypes = language === JavaScript
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
    const classAndMethodNames = extractClassAndMethodNames(rootNode);
    const namesAndValues = extractNamesAndValues(rootNode);
    const customConstants = extractCustomConstants(rootNode);

    return {
        sourceCode,
        sqlQueries,
        functionNames,
        constants,
        jsonObjects,
        variables,
        comments,
        classAndMethodNames,
        namesAndValues,
        customConstants
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

    function isObjectString(str) {
        return /^\s*\{[\s\S]*\}\s*$/.test(str);
    }

    function extractValues(item) {
        if (Array.isArray(item)) {
            item.forEach(extractValues);
        } else if (typeof item === 'object') {
            Object.values(item).forEach(extractValues);
        } else if (typeof item === 'string' && !isObjectString(item)) {
            result.push(item);
        }
    }

    values.forEach(extractValues);
    // console.log(result)
    return {result, sourceCode};
}

const {sourceCode, result} = objectToArray(parsedResult);
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