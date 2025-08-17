import { checkEnvironment, getRequiredEnvVars } from "../lib/utils/env-validation"

function main() {
  console.log("🔍 Validating environment variables...")

  const check = checkEnvironment()

  if (check.valid) {
    console.log("✅ All environment variables are valid!")
    return
  }

  console.log("❌ Environment validation failed:")

  if (check.missing.length > 0) {
    console.log("\n📋 Missing required variables:")
    check.missing.forEach((variable) => {
      console.log(`  - ${variable}`)
    })
  }

  if (check.errors.length > 0) {
    console.log("\n⚠️  Invalid variables:")
    check.errors.forEach((error) => {
      console.log(`  - ${error}`)
    })
  }

  console.log("\n💡 Required environment variables:")
  getRequiredEnvVars().forEach((variable) => {
    const status = process.env[variable] ? "✅" : "❌"
    console.log(`  ${status} ${variable}`)
  })

  process.exit(1)
}

if (require.main === module) {
  main()
}
