import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
;(async () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  console.log(__dirname)
  const configDir = resolve(__dirname, '../')
  const configFile = 'drizzle.config.js'

  const configPath = resolve(configDir, configFile)

  if (existsSync(configPath)) {
    console.log(`Found ${configFile} files:`, configPath)

    console.log(`Running drizzle-kit for: ${configPath}`)
    execSync(`npx drizzle-kit migrate --config=${configPath}`, { encoding: 'utf-8' })
  } else {
    console.log('The config file does not exist.', configPath)
  }
})()
