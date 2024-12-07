import { Command } from 'commander'
import { createApiClient } from '@neondatabase/api-client'
import 'dotenv/config'

if (!process.env.NEON_API_KEY) {
  throw new Error('NEON_API_KEY is not set')
}

const program = new Command()
const neonApi = createApiClient({
  apiKey: process.env.NEON_API_KEY,
})

program.option('-n, --name <name>', 'The name of the fascia to create').parse(process.argv)
const options = program.opts()

if (options.name) {
  console.log(`Creating fascia ${options.name}`)

  try {
    const response = await neonApi.createProjectBranchDatabase(
      process.env.NEON_PROJECT_ID,
      process.env.NEON_BRANCH_ID,
      {
        database: {
          name: options.name,
          owner_name: 'neondb_owner',
        },
      },
    )

    const { data } = response
    console.log(data)
  } catch (error) {
    console.error('Error creating project', error)
  }
} else {
  console.error('Fascia name is required')
  process.exit(1)
}
