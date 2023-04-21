import { config } from "dotenv"
config()

import { Configuration, OpenAIApi } from "openai"
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY
}
))

openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
        {role: "system", content: 'Please extract the personally identifiable information as JSON list. Example: ["John Smith", "3/4/1987"]'},
        {role: "user", content: "CUSTOMER NAME 123 MAIN STREET VANCOUVER, WA 98661 ACCOUNT Albert Einstein SERVICE ADDRESS: SERVICE PERIOD: BILLING DATE: DUE DATE: 000000-000 123 MAIN STREET 12/1/2017 To 1/31/2018 12/29/2017 1/31/2018 SPECIAL MESSAGE PLEASE TAKE NOTE, P.O. BOX 3855, Seattle, WA 98124 is the District's new mailing address. Payments received by mail or online banking must be sent to the new address! Please allow additional time for processing payments. CURRENT CHARGES SEWER SERVICE 76.00 TOTAL CURRENT CHARGES 76.00 BILL SUMMARY PREVIOUS BALANCE 76.00 PAYMENTS -76.00 ADJUSTMENTS 0.00 MISCELLANEOUS 0.00 FINANCE CHARGE 0.00 LIEN INTEREST 0.00 CURRENT CHARGES 76.00 TOTAL AMOUNT DUE 76.00"}
    ],
}).then(result => {
    console.log(result.data.choices)
})