import Database from "better-sqlite3"

const db = new Database("request_logs.db", { readonly: true })

const totalRows = db.prepare("SELECT COUNT(*) as c FROM request_logs").get() as { c: number }
const total200 = db.prepare("SELECT COUNT(*) as c FROM request_logs WHERE response_status = 200").get() as { c: number }
const total500 = db.prepare("SELECT COUNT(*) as c FROM request_logs WHERE response_status = 500").get() as { c: number }
const byStatus = db.prepare(`
    SELECT response_status AS status, COUNT(*) AS c
    FROM request_logs
    GROUP BY response_status
    ORDER BY response_status
`).all() as { status: number; c: number }[]

if (totalRows.c === 0) {
    console.log(`--------------------------------`)
    console.log(`Uptime report`)
    console.log(`--------------------------------`)
    console.log(`No data found in request_logs. Run the monitor first (npm run monitor).`)
    console.log(`--------------------------------`)
    process.exit(0)
}

const uptime = (total200.c / totalRows.c) * 100

const firstRequest = db.prepare("SELECT timestamp FROM request_logs ORDER BY timestamp ASC LIMIT 1").get() as { timestamp: string }
const lastRequest = db.prepare("SELECT timestamp FROM request_logs ORDER BY timestamp DESC LIMIT 1").get() as { timestamp: string }

const startTime = new Date(firstRequest.timestamp).getTime()
const endTime = new Date(lastRequest.timestamp).getTime()
const totalTimeMs = endTime - startTime

const logs = db.prepare(`
    SELECT response_status AS status, timestamp 
    FROM request_logs 
    ORDER BY timestamp ASC
`).all() as { status: number; timestamp: string }[]

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

console.log(`--------------------------------`)
console.log(`Uptime report (by total requests)`)
console.log(`--------------------------------`)
console.log(`Total requests: ${totalRows.c}`)
console.log(`Uptime (HTTP 200): ${uptime.toFixed(2)}% (${total200.c}/${totalRows.c})`)
console.log(``)
console.log(`Status breakdown:`)
for (const row of byStatus) {
    console.log(`- ${row.status}: ${row.c} (${formatPct(row.c)})`)
}
console.log(`--------------------------------`)
console.log(`Uptime report (by observed time)`)
console.log(`--------------------------------`)
console.log(`Window: ${formatTs(firstRequest.timestamp)} -> ${formatTs(lastRequest.timestamp)}`)
console.log(`Total monitoring time: ${(totalTimeMs/1000/60).toFixed(2)} minutes`)
console.log(`Uptime (HTTP 200): ${Number.isNaN(uptimeByTime) ? 'N/A' : uptimeByTime.toFixed(2) + '%'}`)
if (Number.isNaN(uptimeByTime)) {
    console.log(`Note: need at least 2 log entries to compute time-based uptime.`)
}
console.log(`--------------------------------`)



