import { existsSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createApiClient } from '@neondatabase/api-client'
;(async () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

  const scriptName = pkg.name.replace(/-/g, '_')
  const configDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

  const configPath = path.join(configDir, 'drizzle.config.ts')

  if (!process.env.CI) {
    const { NEON_API_KEY, NEON_ORG_ID } = process.env
    if (!NEON_API_KEY || !NEON_ORG_ID) {
      throw new Error('NEON_API_KEY and NEON_ORG_ID are required')
    }
    const neonApi = createApiClient({
      apiKey: NEON_API_KEY,
    })

    const response = await neonApi.listProjects({
      orgId: NEON_ORG_ID,
    })

    let {
      data: { projects },
    } = response

    projects = projects.filter((p) => p.name.startsWith(scriptName + '_'))

    await Promise.all(
      projects.map(async (project) => {
        const { name } = project
        const banner = name.split(scriptName + '_')[1]

        // Retrieve the 1Password secret for the project
        const projectSecret = await op.getSecret(project.id)

        console.log(`Running drizzle-kit for: ${configPath}`)
        execSync(`npx drizzle-kit migrate --config=${configPath}`, { encoding: 'utf-8' })
      }),
    )
  } else {
    console.log('Running in CI, skipping neon api client creation')
    if (existsSync(configPath)) {
      console.log('Found drizzle.config.ts files:', configPath)

      console.log(`Running drizzle-kit for: ${configPath}`)
      execSync(`npx drizzle-kit migrate --config=${configPath}`, { encoding: 'utf-8' })
    } else {
      console.log('The config file does not exist.')
    }
  }
})()
