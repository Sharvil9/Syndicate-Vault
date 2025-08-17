import { createClient } from "@supabase/supabase-js"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filename: string): Promise<void> {
  console.log(`Running migration: ${filename}`)

  const migrationPath = join(process.cwd(), "scripts", filename)
  const sql = readFileSync(migrationPath, "utf-8")

  // Split SQL by statements (basic implementation)
  const statements = sql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql_query: statement })
      if (error) {
        console.error(`Error in statement: ${statement.substring(0, 100)}...`)
        throw error
      }
    } catch (error) {
      console.error(`Migration failed: ${filename}`)
      throw error
    }
  }

  console.log(`✅ Migration completed: ${filename}`)
}

async function runMigrations() {
  try {
    const scriptsDir = join(process.cwd(), "scripts")
    const files = readdirSync(scriptsDir)
      .filter((file) => file.endsWith(".sql") && file.match(/^\d{3}-/))
      .sort()

    console.log(`Found ${files.length} migration files`)

    for (const file of files) {
      await runMigration(file)
    }

    console.log("🎉 All migrations completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  runMigrations()
}

export { runMigrations }
