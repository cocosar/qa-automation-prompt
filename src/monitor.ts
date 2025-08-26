import "dotenv/config"
import { callApi } from "./http"
import { openDb } from "./db"
import testCases from "../data/test-cases.json"
import chalk from "chalk"
import Database from "better-sqlite3"

const insert = `
INSERT INTO request_logs (url, name_parameter, response_status, response_text, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`
let db: Database.Database | null = null
let stmt: Database.Statement<[string, string, number, string]> | null = null
const monitorTime = Number(process.env.TIMEOUT_MONITOR_IN_MINUTES) || 10
const endAt = Date.now() + monitorTime * 60 * 1000
const timeoutBetweenRequests = Number(process.env.TIMEOUT_BETWEEN_REQUESTS) || 1000

let requests = 0
console.log(chalk.blue(`Monitor started for ${monitorTime} minute(s)`))

const countdownInterval = setInterval(() => {
    const timeRemaining = Math.round((endAt - Date.now()) / 1000)
    if (timeRemaining > 0) {
        process.stdout.write(chalk.yellow(`\rTime remaining: ${timeRemaining} seconds`))    
    } else {
        clearInterval(countdownInterval)
    }
}, 1000)

const initialTimeRemaining = Math.round((endAt - Date.now()) / 1000)
process.stdout.write(chalk.yellow(`\rTime remaining: ${initialTimeRemaining} seconds`))

try {
    db = openDb()
    stmt = db.prepare(insert)
} catch (error) {
    clearInterval(countdownInterval)
    process.stdout.write(`\n`)
    console.error(chalk.red("Failed to open database or prepare statement:"), error instanceof Error ? error.message : 'Unknown database error')
    process.exit(1)
}

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
                stmt!.run(url, nameParameterStr, status, responseText)
                requests++
            } catch (dbError) {
                console.error(chalk.red(`\nFailed to write to database for ${nameParameterStr}:`), dbError instanceof Error ? dbError.message : 'Unknown database error')
                requests++
            }
            
            await new Promise(resolve => setTimeout(resolve, timeoutBetweenRequests))
        }
    }
} finally {
    clearInterval(countdownInterval)
    process.stdout.write(`\n`)
    console.log(chalk.green(`Monitor finished. ${requests} requests were made in ${monitorTime} minutes`))
    try { db?.close() } catch {}
}
