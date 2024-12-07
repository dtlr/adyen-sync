import { createApiClient } from '@neondatabase/api-client'
import { ItemBuilder, OnePasswordConnect } from '@1password/connect'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parseConnectionUri } from './utils.js'
import 'dotenv/config'

if (!process.env.NEON_API_KEY) {
  throw new Error('NEON_API_KEY is not set')
}

const BANNERS = ['dtlr', 'spc']

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
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

const scriptName = 'adyen_sync'
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
    console.error(`Database ${banner} already exists`)
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
          value: conn.port,
          type: 'STRING',
        })
        .addField({
          label: 'connection options',
          value: conn.params,
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

    // const items = await op.items.listAll(vault.id)
    // if (
    //   items.elements.length > 0 &&
    //   items.elements.some((i) => i.title === projectName.replace(/_/g, '-'))
    // ) {
    //   console.info(`Secrets for project ${projectName} already exist`)
    // } else {
    //   console.info(`Creating secrets for project ${projectName}`)
    //   const {
    //     data: { uri },
    //   } = await neonApi.getConnectionUri({
    //     projectId,
    //     branch_id: branchId,
    //     database_name: banner,
    //     role_name: roleName,
    //   })
    //   const connectionDetails = parseConnectionUri(uri)
    //   try {
    //     const sectionId = createId()
    //     let item = await op.items.create({
    //       vaultId: vault.id,
    //       category: onepassSdk.ItemCategory.Login,
    //       title: projectName.replace(/_/g, '-').toLowerCase(),
    //       fields: [
    //         {
    //           fieldType: onepassSdk.ItemFieldType.Text,
    //           id: createId(),
    //           title: 'database',
    //           value: banner,
    //           sectionId,
    //         },
    //         {
    //           fieldType: onepassSdk.ItemFieldType.Text,
    //           id: 'username',
    //           title: 'username',
    //           value: connectionDetails.username,
    //         },
    //         {
    //           fieldType: onepassSdk.ItemFieldType.Concealed,
    //           id: 'password',
    //           title: 'password',
    //           value: connectionDetails.password,
    //         },
    //         {
    //           fieldType: onepassSdk.ItemFieldType.Text,
    //           id: createId(),
    //           title: 'server',
    //           value: connectionDetails.host,
    //           sectionId,
    //         },
    //         {
    //           fieldType: onepassSdk.ItemFieldType.Text,
    //           id: createId(),
    //           title: 'port',
    //           value: connectionDetails.port,
    //           sectionId,
    //         },
    //         {
    //           fieldType: onepassSdk.ItemFieldType.Text,
    //           id: createId(),
    //           title: 'connection options',
    //           value: connectionDetails.params,
    //           sectionId,
    //         },
    //       ],
    //       sections: [{ id: sectionId, title: 'Database' }],
    //       websites: [],
    //       tags: [
    //         'neon',
    //         scriptName,
    //         scriptName.replace(/_/g, '-').toLowerCase(),
    //         projectName,
    //         projectName.replace(/_/g, '-').toLowerCase(),
    //         banner,
    //       ],
    //     })
    //     // const ritem = await op.items.get(vault.id, item.id)
    //     // await op.items.put({
    //     //   ...ritem,
    //     //   fields: [
    //     //     // {
    //     //     //   fieldType: onepassSdk.ItemFieldType.Unsupported,
    //     //     //   id: 'database_type',
    //     //     //   title: 'type',
    //     //     //   value: 'PostgreSQL',
    //     //     // },
    //     //     {
    //     //       fieldType: onepassSdk.ItemFieldType.Text,
    //     //       id: 'database',
    //     //       title: 'database',
    //     //       value: banner,
    //     //       sectionId: '',
    //     //     },
    //     //     {
    //     //       fieldType: onepassSdk.ItemFieldType.Text,
    //     //       id: 'username',
    //     //       title: 'username',
    //     //       value: connectionDetails.username,
    //     //       sectionId: '',
    //     //     },
    //     //     {
    //     //       fieldType: onepassSdk.ItemFieldType.Concealed,
    //     //       id: 'password',
    //     //       title: 'password',
    //     //       value: connectionDetails.password,
    //     //       sectionId: '',
    //     //     },
    //     //     {
    //     //       fieldType: onepassSdk.ItemFieldType.Text,
    //     //       id: 'hostname',
    //     //       title: 'server',
    //     //       value: connectionDetails.host,
    //     //       sectionId: '',
    //     //     },
    //     //     {
    //     //       fieldType: onepassSdk.ItemFieldType.Text,
    //     //       id: 'port',
    //     //       title: 'port',
    //     //       value: connectionDetails.port,
    //     //       sectionId: '',
    //     //     },
    //     //     {
    //     //       fieldType: onepassSdk.ItemFieldType.Text,
    //     //       id: 'options',
    //     //       title: 'connection options',
    //     //       value: connectionDetails.params,
    //     //       sectionId: '',
    //     //     },
    //     //   ],
    //     // })
    //   } catch (error) {
    //     console.error(error)
    //     process.exit(1)
    //   }
    // }
  }
}

const exItem = await op.items.get(vault.id, 'ixx22fiiif6p4q4g72n2dyxxka')
console.log(exItem)
