import Database from "better-sqlite3"
import { readFileSync } from "fs"

export const openDb = () => {
	const db = new Database("request_logs.db")
    db.pragma("journal_mode = WAL")
	const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf-8")
	db.exec(schema)
	return db
}