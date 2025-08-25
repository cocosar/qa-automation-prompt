import testCases from "../data/test-cases-special.json"
import { callApi } from "./http"
import dotenv from "dotenv"
import chalk from 'chalk';

dotenv.config()

const baseUrl = process.env.BASE_URL || "https://qa-challenge-nine.vercel.app"
const apiUrl = process.env.API_URL || "/api/name-checker"

console.log(`Running bug reproduction for test cases with bugs...`)

for (const testCase of testCases.testCases) {
    console.log(chalk.blue(`\nCase ${testCases.testCases.indexOf(testCase) + 1}: ${testCase}`))
    const res = await callApi(testCase as any)
    console.log('Error: ' + chalk.red(res.errorMsg || res.body))
    console.log(chalk.yellow(`To reproduce the error, run the following request:`))
    console.log(
        chalk.cyan(`curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify({ name: testCase })}' ${baseUrl}${apiUrl}`)
    )
}