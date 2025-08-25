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
    }
}, 1000)

const initialTimeRemaining = Math.round((endAt - Date.now()) / 1000)
process.stdout.write(`\rTime remaining: ${initialTimeRemaining} seconds`)

while (Date.now() < endAt) {
	for (const testCase of testCases.testCases) {
		const res = await callApi(testCase)
		const status = res.status
		const url = res.url
		const responseText = res.errorMsg ??
			(typeof res.body === 'object' && res.body !== null && 'name' in res.body
				? JSON.stringify((res.body as any).name)
				: JSON.stringify(res.body ?? null))
		const nameParameterStr = typeof res.nameParameter === 'string' ? res.nameParameter : JSON.stringify(res.nameParameter)
		stmt.run(url, nameParameterStr, status, responseText)
		requests++
        await new Promise(resolve => setTimeout(resolve, timeoutBetweenRequests))
	}
}

clearInterval(countdownInterval)
process.stdout.write(`\n`)
console.log(`Monitor finished. ${requests} requests were made in ${monitorTime} minutes`)
