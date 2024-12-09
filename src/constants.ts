import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const POSWRKIDS = ['21', '22', '23', '24', '25', '26', '27', '28', '29']

export const STOREREFPATTERN = /^([A-Z]+)(\d+)$/

export const JDNAProperty = JSON.parse(
  readFileSync(join(__dirname, '../src/property.json'), 'utf8'),
) as Record<string, string>

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

export const APP_ENVS = ['live', 'test', 'prod', 'dev'] as const
