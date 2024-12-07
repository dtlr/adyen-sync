import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { createApiClient } from '@neondatabase/api-client'
import { Octokit } from 'octokit'

import { drizzleConfig } from '../templates/drizzle-config.js'
import { githubWorkflow } from '../templates/github-workflow.js'
import { encryptSecret } from './utils.js'

const BANNERS = ['dtlr', 'spc']
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})
const neonApi = createApiClient({
  apiKey: process.env.NEON_API_KEY,
})

const orgName = 'dtlr'
const repoName = 'adyen-sync'
let secrets = []

;(async () => {
  if (!existsSync('configs')) {
    mkdirSync('configs')
  }

  const response = await neonApi.listProjects({
    orgId: process.env.NEON_ORG_ID,
  })

  const {
    data: { projects },
  } = response

  const project = projects.find((p) => p.name === 'adyen_sync')

  const { id } = project
  await Promise.all(
    BANNERS.map(async (banner) => {
      const {
        data: { uri },
      } = await neonApi.getConnectionUri({
        projectId: id,
        database_name: banner,
        role_name: 'adyen_sync',
      })

      const safeName = banner.toLowerCase().replace(/_/g, '-')
      const path = `configs/${safeName}`
      const file = 'drizzle.config.ts'
      const envVarName = `${banner.toUpperCase()}_DATABASE_URI`
      const encryptedUri = await encryptSecret(process.env.PUBLIC_KEY, uri)

      secrets.push(envVarName)

      if (!existsSync(path)) {
        mkdirSync(path)
        console.info('Set secret for:', safeName)
      }

      if (existsSync(`${path}/${file}`)) {
        writeFileSync(`${path}/${file}`, drizzleConfig(safeName, envVarName))
        console.info('Set drizzle config for:', safeName)
      }
    }),
  )

  if (!existsSync('.github')) {
    mkdirSync('.github')
  }

  if (!existsSync('.github/workflows')) {
    mkdirSync('.github/workflows')
  }

  const workflowContent = githubWorkflow(secrets)
  writeFileSync('.github/workflows/run-migrations.yml', workflowContent)
  console.info('Finished')
})()
