import Database from "better-sqlite3"
import chalk from "chalk"
import dotenv from "dotenv"

dotenv.config()

let db: Database.Database

try {
    const dbPath = process.env.DB_PATH || "request_logs.db"
    db = new Database(dbPath, { readonly: true })
} catch (error) {
    console.error(chalk.red("Failed to connect to database:"), error instanceof Error ? error.message : 'Unknown database error')
    console.log(chalk.red("Make sure the database file exists and run 'npm run monitor' first."))
    process.exit(1)
}

let totalRows: { c: number }
let total200: { c: number }
let total500: { c: number }
let byStatus: { status: number; c: number }[]

try {
    totalRows = db.prepare("SELECT COUNT(*) as c FROM request_logs").get() as { c: number }
    total200 = db.prepare("SELECT COUNT(*) as c FROM request_logs WHERE response_status = 200").get() as { c: number }
    total500 = db.prepare("SELECT COUNT(*) as c FROM request_logs WHERE response_status = 500").get() as { c: number }
    byStatus = db.prepare(`
        SELECT response_status AS status, COUNT(*) AS c
        FROM request_logs
        GROUP BY response_status
        ORDER BY response_status
    `).all() as { status: number; c: number }[]
} catch (error) {
    console.error(chalk.red("Failed to query database:"), error instanceof Error ? error.message : 'Unknown database error')
    console.log(chalk.red("The database might be corrupted or have an incorrect schema."))
    console.log(chalk.red("Try deleting the database file and running 'npm run monitor' again."))
    process.exit(1)
}

if (totalRows.c === 0) {
    console.log(chalk.blue(`--------------------------------`))
    console.log(chalk.blue(`Uptime report`))
    console.log(chalk.blue(`--------------------------------`))
    console.log(chalk.blue(`No data found in request_logs. Run the monitor first (npm run monitor).`))
    console.log(chalk.blue(`--------------------------------`))
    process.exit(0)
}

const uptime = (total200.c / totalRows.c) * 100

let firstRequest: { timestamp: string }
let lastRequest: { timestamp: string }
let logs: { status: number; timestamp: string }[]

try {
    firstRequest = db.prepare("SELECT timestamp FROM request_logs ORDER BY timestamp ASC LIMIT 1").get() as { timestamp: string }
    lastRequest = db.prepare("SELECT timestamp FROM request_logs ORDER BY timestamp DESC LIMIT 1").get() as { timestamp: string }
    logs = db.prepare(`
        SELECT response_status AS status, timestamp 
        FROM request_logs 
        ORDER BY timestamp ASC
    `).all() as { status: number; timestamp: string }[]
} catch (error) {
    console.error(chalk.red("Failed to query timestamp data from database:"), error instanceof Error ? error.message : 'Unknown database error')
    console.log(chalk.red("The database might be corrupted or have missing data."))
    process.exit(1)
}

const startTime = new Date(firstRequest.timestamp).getTime()
const endTime = new Date(lastRequest.timestamp).getTime()
const totalTimeMs = endTime - startTime

function parseSqliteTimestampToMs(ts: string): number {
    const normalized = ts.includes("T") ? ts : ts.replace(" ", "T")
    return new Date(/Z$/i.test(normalized) ? normalized : `${normalized}Z`).getTime()
}

let totalObservedMs = 0
let healthyObservedMs = 0

for (let i = 0; i < logs.length - 1; i++) {
    const t0 = parseSqliteTimestampToMs(logs[i].timestamp)
    const t1 = parseSqliteTimestampToMs(logs[i + 1].timestamp)
    const delta = Math.max(0, t1 - t0)
    totalObservedMs += delta
    if (logs[i].status === 200) healthyObservedMs += delta
}

const uptimeByTime = totalObservedMs > 0 ? (healthyObservedMs / totalObservedMs) * 100 : NaN



const formatPct = (n: number) => `${((n / totalRows.c) * 100).toFixed(2)}%`
const formatTs = (ts: string) => {
    const ms = parseSqliteTimestampToMs(ts)
    return new Date(ms).toISOString()
}

console.log(chalk.blue(`--------------------------------`))
console.log(chalk.blue(`Uptime report (by total requests)`))
console.log(chalk.blue(`--------------------------------`))
console.log(chalk.yellow(`Total requests:`+ chalk.green(` ${totalRows.c}`)))
console.log(chalk.yellow(`Uptime (HTTP 200):`+ chalk.green(` ${uptime.toFixed(2)}% (${total200.c}/${totalRows.c})`)))
console.log(chalk.blue(`--------------------------------`))
console.log(chalk.blue(`Status breakdown:`))
for (const row of byStatus) {
    console.log(chalk.yellow(`- ${row.status}: `+ chalk.green(`${row.c} (${formatPct(row.c)})`)))
}
console.log(chalk.blue(`--------------------------------`))
console.log(chalk.blue(`Uptime report (by observed time)`))
console.log(chalk.blue(`--------------------------------`))
console.log(chalk.yellow(`Window: `+ chalk.green(`${formatTs(firstRequest.timestamp)} -> ${formatTs(lastRequest.timestamp)}`)))
console.log(chalk.yellow(`Total monitoring time: `+ chalk.green(`${(totalTimeMs/1000/60).toFixed(2)} minutes`)))
console.log(chalk.yellow(`Uptime (HTTP 200): `+ chalk.green(`${Number.isNaN(uptimeByTime) ? 'N/A' : uptimeByTime.toFixed(2) + '%'}`)))
if (Number.isNaN(uptimeByTime)) {
    console.log(chalk.red(`Note: need at least 2 log entries to compute time-based uptime.`))
}
console.log(chalk.blue(`--------------------------------`))



