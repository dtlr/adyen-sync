import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createApiClient } from '@neondatabase/api-client'

import { drizzleConfig } from '../templates/drizzle-config.js'
// import { githubWorkflow } from '../templates/github-workflow.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

const scriptName = pkg.name.replace(/-/g, '_')

const neonApi = createApiClient({
  apiKey: process.env.NEON_API_KEY,
})

;(async () => {
  if (!existsSync('configs')) {
    mkdirSync('configs')
  }

  const response = await neonApi.listProjects({
    orgId: process.env.NEON_ORG_ID,
  })

  let {
    data: { projects },
  } = response

  projects = projects.filter((p) => p.name.startsWith(scriptName + '_'))

  await Promise.all(
    projects.map(async (project) => {
      const { name } = project
      const banner = name.split(scriptName + '_')[1]

      const safeName = banner.toLowerCase().replace(/_/g, '-')
      const path = `configs/${safeName}`
      const file = 'drizzle.config.ts'
      const envVarName = `${banner.toUpperCase()}_DATABASE_URI`

      if (!existsSync(path)) {
        mkdirSync(path)
      }

      if (!existsSync(`${path}/${file}`)) {
        writeFileSync(`${path}/${file}`, drizzleConfig(safeName, envVarName))
        console.info('Set drizzle config for:', safeName)
      }

      console.log('Run drizzle-kit generate for :', safeName)
      try {
        const output = execSync(`drizzle-kit generate --config=${path}/${file}`, {
          encoding: 'utf-8',
        })
        if (output.trim()) {
          console.log('Drizzle output:', output.trim())
        }
      } catch (error) {
        console.error(`Failed to generate schema for ${safeName}:`, error.message)
        if (error.stdout?.trim()) {
          console.error('Output:', error.stdout.trim())
        }
        if (error.stderr?.trim()) {
          console.error('Error:', error.stderr.trim())
        }
      }
    }),
  )

  // if (!existsSync('.github')) {
  //   mkdirSync('.github')
  // }

  // if (!existsSync('.github/workflows')) {
  //   mkdirSync('.github/workflows')
  // }

  // const workflowContent = githubWorkflow()
  // writeFileSync('.github/workflows/run-migrations.yml', workflowContent)
  // console.info('Finished')
})()
