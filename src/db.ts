import Database from "better-sqlite3"
import { readFileSync } from "fs"
import dotenv from "dotenv"

dotenv.config()

const dbPath = process.env.DB_PATH || ""

export const openDb = () => {
	const db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
	const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf-8")
	db.exec(schema)
	return db
}