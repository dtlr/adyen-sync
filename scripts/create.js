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
  console.log(typeof options.name)

  const response = await neonApi.createProject({
    project: {
      name: options.name,
      pg_version: '16',
      region_id: 'aws-us-east-1',
      org_id: process.env.NEON_ORG_ID,
    },
  })

  const { data } = response
  console.log(data)
} else {
  console.error('Fascia name is required')
  process.exit(1)
}
