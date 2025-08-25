import { openDb } from "./db"
import chalk from "chalk"
const db = openDb()

const countStmt = db.prepare("SELECT COUNT(*) as c FROM request_logs")
const before = countStmt.get() as { c: number }

const deleteStmt = db.prepare("DELETE FROM request_logs")
const vacuumStmt = db.prepare("VACUUM")

deleteStmt.run()
vacuumStmt.run()

const after = countStmt.get() as { c: number }

console.log(chalk.yellow(`Records before: `+ chalk.green(`${before.c}`)))
console.log(chalk.yellow(`Records after: `+ chalk.green(`${after.c}`)))

db.close()


