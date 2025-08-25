import testCases from "../data/test-cases-special.json"
import { callApi } from "./http"
import dotenv from "dotenv"

dotenv.config()

const baseUrl = process.env.BASE_URL || "https://qa-challenge-nine.vercel.app"
const apiUrl = process.env.API_URL || "/api/name-checker"

console.log(`Running bug reproduction for test cases with bugs...`)

for (const testCase of testCases.testCases) {
    const label = typeof testCase === "string" ? testCase : JSON.stringify(testCase)
    console.log(`\nCase: ${label}`)
    const res = await callApi(testCase as any)
    console.log(res)
    console.log(`To reproduce the error, run the following request:`)
    console.log(
        `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify({ name: testCase })}' ${baseUrl}${apiUrl}`
    )
}