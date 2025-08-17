import { createClient } from "@supabase/supabase-js"
import { writeFileSync } from "fs"
import { join } from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backupTable(tableName: string): Promise<any[]> {
  console.log(`Backing up ${tableName}...`)

  const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: true })

  if (error) {
    console.error(`Error backing up ${tableName}:`, error)
    return []
  }

  return data || []
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupDir = join(process.cwd(), "backups")

  try {
    const tables = [
      "users",
      "spaces",
      "categories",
      "items",
      "attachments",
      "revisions",
      "edit_requests",
      "activity_log",
      "invite_codes",
    ]

    const backup: Record<string, any[]> = {}

    for (const table of tables) {
      backup[table] = await backupTable(table)
    }

    const backupFile = join(backupDir, `backup-${timestamp}.json`)
    writeFileSync(backupFile, JSON.stringify(backup, null, 2))

    console.log(`Backup completed: ${backupFile}`)
    console.log(`Total records backed up: ${Object.values(backup).reduce((sum, records) => sum + records.length, 0)}`)
  } catch (error) {
    console.error("Backup failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  createBackup()
}

export { createBackup }
