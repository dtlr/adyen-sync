import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { drizzleConfigSingle } from '../templates/drizzle-config.js'
// import { githubWorkflow } from '../templates/github-workflow.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

const scriptName = pkg.name.replace(/-/g, '_')

;(async () => {
  const path = __dirname
  const file = 'drizzle.config.ts'
  const envVarName = `APP_NEON_DATABASE_URI`

  const newContent = drizzleConfigSingle(envVarName)
  const filePath = `${path}/${file}`

  console.info('Set drizzle config')
  if (existsSync(filePath)) {
    const existingContent = readFileSync(filePath, 'utf8')
    const crypto = await import('crypto')
    const existingHash = crypto.createHash('sha256').update(existingContent).digest('hex')
    const newHash = crypto.createHash('sha256').update(newContent).digest('hex')

    if (existingHash !== newHash) {
      writeFileSync(filePath, newContent)
    }
  } else {
    writeFileSync(filePath, newContent)
  }

  console.log('Run drizzle-kit generate :')
  try {
    const output = execSync(`npx --yes drizzle-kit generate --config=${filePath}`, {
      encoding: 'utf-8',
    })
    if (output.trim()) {
      console.log('Drizzle output:', output.trim())
    }
  } catch (error) {
    console.error(`Failed to generate schema:`, error.message)
    if (error.stdout?.trim()) {
      console.error('Output:', error.stdout.trim())
    }
    if (error.stderr?.trim()) {
      console.error('Error:', error.stderr.trim())
    }
  }

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
