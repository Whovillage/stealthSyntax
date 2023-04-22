const dotenv = require('dotenv').config()
const { OpenAIApi, Configuration } = require('openai');

//import { Configuration, OpenAIApi } from "openai"
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY
}));

function fixCodeWithGPT(tekst) {
    //console.log(tekst) //votab ilusti
    return new Promise((resolve, reject) => {
        openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: 'Add error handling. DO NOT CHANGE VARIABLE NAMES. Output the answer as a JSON that contains two elements. The first element must contain only the description about the changes that were made to the code and the second element should only contain the fixed code. Example - {"changesMade": "", "fixedCode": ""]'},
                {role: "user", content: tekst}
            ],
        }).then(result => {
            const choices = result.data.choices;
            const assistantMessageContent = choices.find(choice => choice.message.role === 'assistant').message.content;
            console.log(assistantMessageContent)
            var jsonString = assistantMessageContent;
            var jsonObj = JSON.parse(jsonString);
            resolve(jsonObj);
        }).catch(error => {
            reject(error);
        });
    });
}

module.exports = fixCodeWithGPT;