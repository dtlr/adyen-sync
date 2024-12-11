import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
;(async () => {
  const configDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../configs')

  if (existsSync(configDir)) {
    const banners = readdirSync(configDir)

    const configPaths = banners
      .map((banner) => path.join(configDir, banner, 'drizzle.config.ts'))
      .filter((filePath) => existsSync(filePath))

    console.log('Found drizzle.config.ts files:', configPaths)

    configPaths.forEach((configPath) => {
      console.log(`Running drizzle-kit for: ${configPath}`)
      execSync(`npx drizzle-kit migrate --config=${configPath}`, { encoding: 'utf-8' })
    })
  } else {
    console.log('The configs directory does not exist.')
  }
})()
