import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { ItemBuilder, OnePasswordConnect } from '@1password/connect'
import { createApiClient } from '@neondatabase/api-client'
import { parseConnectionUri } from './utils.js'
import 'dotenv/config'

if (!process.env.NEON_API_KEY) {
  throw new Error('NEON_API_KEY is not set')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BANNERS = Object.keys(
  JSON.parse(readFileSync(join(__dirname, '../src/property.json'), 'utf8')),
)
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))
const op = OnePasswordConnect({
  serverURL: 'https://opconnect.az.dtlr.io',
  token: process.env.CONNECT_TOKEN,
  keepAlive: true,
})
const vault = await op.getVault('Engineering')

if (!vault) {
  console.warn('Vault not found')
} else {
  console.info(`Vault found: ${vault.id}`)
}

const neonApi = createApiClient({
  apiKey: process.env.NEON_API_KEY,
})

const scriptName = pkg.name.replace(/-/g, '_')
const roleName = scriptName
let hasRunningOperations = false

/** @type {string | undefined} */
let projectId
/** @type {string | undefined} */
let branchId

// Get current git branch name
const { execSync } = await import('child_process')
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
console.info(`Current git branch: ${currentBranch}`)

for (const banner of BANNERS) {
  //Check if the project exists
  const project = await neonApi.listProjects()
  const projectName = `${scriptName}_${banner}`
  if (!project.data.projects.some((p) => p.name === projectName)) {
    console.error(`Project ${projectName} does not exist`)
    const project = await neonApi.createProject({
      project: {
        name: projectName,
        provisioner: 'k8s-neonvm',
        store_passwords: true,
        org_id: process.env.NEON_ORG_ID,
        default_endpoint_settings: {
          autoscaling_limit_min_cu: 0.5,
          autoscaling_limit_max_cu: 4,
          suspend_timeout_seconds: 0,
        },
        settings: {
          allowed_ips: {
            ips: [],
            protected_branches_only: false,
          },
          enable_logical_replication: false,
        },
        branch: {
          name: 'main',
          database_name: banner,
          role_name: roleName,
        },
      },
    })
    hasRunningOperations = project.data.operations.some((o) => o.status === 'running')
    while (hasRunningOperations) {
      console.info('Waiting for project to be created...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const operations = await neonApi.listProjectOperations({
        projectId: project.data.project.id,
      })
      hasRunningOperations = operations.data.operations.some((o) => o.status === 'running')
    }
    hasRunningOperations = false
    console.info(`Project created with id ${project.data.project.id}`)
    projectId = project.data.project.id
    await storeSecrets(
      vault,
      banner,
      project.data.branch.id,
      projectId,
      projectName + '_' + (project.data.branch.name === 'main' ? 'live' : 'test'),
    )
  } else {
    console.info(`Project ${projectName} exists`)
    projectId = project.data.projects.find((p) => p.name === projectName)?.id
    do {
      const operations = await neonApi.listProjectOperations({
        projectId,
      })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      hasRunningOperations = operations.data.operations.some((o) => o.status === 'running')
    } while (hasRunningOperations)
  }

  //Check if the branch exists
  let existingBranches = await neonApi.listProjectBranches(projectId)

  if (!existingBranches.data.branches.some((b) => b.name === currentBranch)) {
    console.error(`Branch ${currentBranch} does not exist. Creating...`)
    const branch = await neonApi.createProjectBranch(projectId, {
      branch: {
        name: currentBranch,
      },
      endpoints: [
        {
          type: 'read_write',
        },
      ],
    })
    hasRunningOperations = branch.data.operations.some((o) => o.status === 'running')
    while (hasRunningOperations) {
      console.info('Waiting for branch to be created...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const operations = await neonApi.listProjectOperations({
        projectId,
      })
      hasRunningOperations = operations.data.operations.some((o) => o.status === 'running')
    }
    hasRunningOperations = false
    branchId = branch.data.branch.id
    console.log('Branch details:', branch.data)
  } else {
    branchId = existingBranches.data.branches.find((b) => b.name === currentBranch)?.id
    const branch = await neonApi.getProjectBranch(projectId, branchId)
    console.log('Branch details:', branch.data)
  }

  // Check if branch role exists
  const branchRole = await neonApi.listProjectBranchRoles(projectId, branchId)
  if (!branchRole.data.roles.some((r) => r.name === roleName)) {
    console.error('Branch role does not exist. Creating...')
    const role = await neonApi.createProjectBranchRole(projectId, branchId, {
      role: {
        name: roleName,
      },
    })
    hasRunningOperations = role.data.operation.status === 'running'
    while (hasRunningOperations) {
      console.info('Waiting for branch role to be created...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const operations = await neonApi.listProjectOperations({
        projectId,
      })
      hasRunningOperations = operations.data.operations.some((o) => o.status === 'running')
    }
    hasRunningOperations = false
  }

  const existingDatabases = await neonApi.listProjectBranchDatabases(projectId, branchId)
  const database = existingDatabases.data.databases.find((db) => db.name === banner)

  //Check if the database already exists
  if (database) {
    console.info(`Database ${banner} already exists`)
  } else {
    console.info(`Creating database for fascia ${banner}`)
    const database = await neonApi.createProjectBranchDatabase(projectId, branchId, {
      database: {
        name: banner,
        owner_name: roleName,
      },
    })
    hasRunningOperations = database.data.operations.some((o) => o.status === 'running')
    while (hasRunningOperations) {
      console.info('Waiting for database to be created...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const operations = await neonApi.listProjectOperations({
        projectId,
      })
      hasRunningOperations = operations.data.operations.some((o) => o.status === 'running')
    }
    hasRunningOperations = false
    console.log('Database details:', database.data)
  }

  await storeSecrets(
    vault,
    banner,
    branchId,
    projectId,
    projectName + '_' + (currentBranch === 'main' ? 'live' : 'test'),
  )
}

/**
 * Store secrets in 1Password
 * @param {import('@1password/connect').Vault} vault - The vault to store the secrets in
 * @param {string} banner - The fascia to store the secrets for
 * @param {string} branchId - The branch id to store the secrets for
 * @param {string} projectId - The project id to store the secrets for
 * @param {string} projectName - The project name to store the secrets for
 */
async function storeSecrets(vault, banner, branchId, projectId, projectName) {
  // Create secrets
  if (vault && vault.id) {
    const {
      data: { uri },
    } = await neonApi.getConnectionUri({
      projectId,
      branch_id: branchId,
      database_name: banner,
      role_name: roleName,
    })
    const conn = parseConnectionUri(uri)
    try {
      const item = await op.getItemByTitle(vault.id, projectName.replace(/_/g, '-'))
      console.info(`Secrets for project ${projectName} already exist`)
      item.database = banner
      item.server = conn.host
      item.port = conn.port.toString()
      item.username = conn.username
      item.password = conn.password
      item.connection_string = uri
      item.connection_options = JSON.stringify(conn.params)
      await op.updateItem(vault.id, item)
    } catch {
      console.info(`Creating secrets for project ${projectName}`)
      const item = new ItemBuilder()
        .setCategory('DATABASE')
        .setTitle(projectName.replace(/_/g, '-'))
        .addField({
          label: 'database',
          value: banner,
          type: 'STRING',
        })
        .addField({
          label: 'username',
          value: conn.username,
          type: 'STRING',
        })
        .addField({
          label: 'password',
          value: conn.password,
          type: 'CONCEALED',
        })
        .addField({
          label: 'server',
          value: conn.host,
          type: 'STRING',
        })
        .addField({
          label: 'port',
          value: conn.port.toString(),
          type: 'STRING',
        })
        .addField({
          label: 'connection_string',
          value: uri,
          type: 'CONCEALED',
        })
        .addField({
          label: 'connection options',
          value: JSON.stringify(conn.params),
          type: 'STRING',
        })
        .addField({
          label: 'type',
          value: 'PostgreSQL',
          type: 'MENU',
        })
        .build()
      await op.createItem(vault.id, item)
    }
  }
}
