import "dotenv/config"
import { callApi } from "./http"
import { openDb } from "./db"
import testCases from "../data/test-cases.json"

const insert = `
INSERT INTO request_logs (url, name_parameter, response_status, response_text, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`
const db = openDb()
const stmt = db.prepare(insert)
const monitorTime = Number(process.env.TIMEOUT_MONITOR_IN_MINUTES) || 10
const endAt = Date.now() + monitorTime * 60 * 1000
const timeoutBetweenRequests = Number(process.env.TIMEOUT_BETWEEN_REQUESTS) || 1000

let requests = 0
console.log(`Monitor started for ${monitorTime} minute(s)`)

const countdownInterval = setInterval(() => {
    const timeRemaining = Math.round((endAt - Date.now()) / 1000)
    if (timeRemaining > 0) {
        process.stdout.write(`\rTime remaining: ${timeRemaining} seconds`)
    } else {
        clearInterval(countdownInterval)
    }
}, 1000)

const initialTimeRemaining = Math.round((endAt - Date.now()) / 1000)
process.stdout.write(`\rTime remaining: ${initialTimeRemaining} seconds`)

try {
    while (Date.now() < endAt) {
        for (const testCase of testCases.testCases) {
            const res = await callApi(testCase)
            const status = res.status
            const url = res.url
            
            let responseText: string
                if (res.errorMsg) {
                responseText = res.errorMsg
            } else if (status === 200 && typeof res.body === 'object' && res.body !== null && 'name' in res.body) {
                responseText = JSON.stringify((res.body as any).name)
            } else {
                responseText = JSON.stringify(res.body ?? null)
            }
            
            const nameParameterStr = typeof res.nameParameter === 'string' ? res.nameParameter : JSON.stringify(res.nameParameter)
            
            try {
                stmt.run(url, nameParameterStr, status, responseText)
                requests++
            } catch (dbError) {
                console.error(`\nFailed to write to database for ${nameParameterStr}:`, dbError instanceof Error ? dbError.message : 'Unknown database error')
                requests++
            }
            
            await new Promise(resolve => setTimeout(resolve, timeoutBetweenRequests))
        }
    }
} finally {
    clearInterval(countdownInterval)
    process.stdout.write(`\n`)
    console.log(`Monitor finished. ${requests} requests were made in ${monitorTime} minutes`)
}
