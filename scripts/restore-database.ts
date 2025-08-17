import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreTable(tableName: string, data: any[]): Promise<void> {
  if (data.length === 0) {
    console.log(`No data to restore for ${tableName}`)
    return
  }

  console.log(`Restoring ${data.length} records to ${tableName}...`)

  // Insert in batches to avoid timeout
  const batchSize = 100
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)

    const { error } = await supabase.from(tableName).upsert(batch, { onConflict: "id" })

    if (error) {
      console.error(`Error restoring batch for ${tableName}:`, error)
      throw error
    }

    console.log(`Restored batch ${Math.floor(i / batchSize) + 1} for ${tableName}`)
  }
}

async function restoreBackup(backupFile: string) {
  try {
    const backupPath = join(process.cwd(), "backups", backupFile)
    const backupData = JSON.parse(readFileSync(backupPath, "utf-8"))

    console.log(`Restoring from ${backupFile}...`)

    // Restore in dependency order
    const restoreOrder = [
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

    for (const table of restoreOrder) {
      if (backupData[table]) {
        await restoreTable(table, backupData[table])
      }
    }

    console.log("Restore completed successfully")
  } catch (error) {
    console.error("Restore failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  const backupFile = process.argv[2]
  if (!backupFile) {
    console.error("Usage: npm run restore <backup-file>")
    process.exit(1)
  }
  restoreBackup(backupFile)
}

export { restoreBackup }
