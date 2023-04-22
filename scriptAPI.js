const dotenv = require('dotenv').config()
const { OpenAIApi, Configuration } = require('openai');

const content = {
    error: 'Add error handling.DO NOT CHANGE VARIABLES! Output the answer as a JSON that contains two elements. The first element must contain only the description about the changes that were made to the code and the second element should only contain the fixed code. Example - {"changesMade": "", "fixedCode": ""]',
    test: 'Add one Jest unit test for the given function. DO NOT CHANGE ANY VARIABLES! Output the answer as a JSON that contains two elements. The first element must contain only the test description and the second element should only contain the test code itself. Example - {"changesMade": "", "fixedCode": ""]',
}

//import { Configuration, OpenAIApi } from "openai"
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY
}));

async function fixCodeWithGPT(tekst) {
    return new Promise((resolve, reject) => {
        openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: content.error},
                {role: "user", content: tekst}
            ],
        }).then(result => {
            const choices = result.data.choices;
            const assistantMessageContent = choices.find(choice => choice.message.role === 'assistant').message.content;
            console.log(assistantMessageContent)
            var jsonString = assistantMessageContent;
            try {
                var jsonObj = JSON.parse(jsonString);
                resolve(jsonObj);
            } catch (error) {
                reject(error);
            }
        }).catch(error => {
            reject(error);
        });
    });
}

async function fixCodeWithGPTWithRetry(tekst, maxRetries = 3, retryInterval = 1000) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        console.log("Trying to analyze code with chatGPT")
        const result = await fixCodeWithGPT(tekst);
        return result;
      } catch (error) {
        retries++;
        console.log(`Function failed, retrying in ${retryInterval}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    throw new Error(`Function failed after ${maxRetries} retries.`);
  }

module.exports = fixCodeWithGPTWithRetry;

