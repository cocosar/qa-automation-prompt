import { openDb } from "./db"

const db = openDb()

const countStmt = db.prepare("SELECT COUNT(*) as c FROM request_logs")
const before = countStmt.get() as { c: number }

const deleteStmt = db.prepare("DELETE FROM request_logs")
const vacuumStmt = db.prepare("VACUUM")

deleteStmt.run()
vacuumStmt.run()

const after = countStmt.get() as { c: number }

console.log(`Records before: ${before.c}`)
console.log(`Records after: ${after.c}`)

db.close()


