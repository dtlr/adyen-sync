import { type Hook } from '@oclif/core'
import { logger } from '@util/logger.js'
import { AppError } from '@/error.js'
import 'dotenv/config'

const checkEnv: Hook<'init'> = async function () {
  const { NODE_ENV, DATABASE_URL, DB_USER, DB_PASSWORD, DB_HOST, ADYEN_KEY } = process.env

  logger('init-env-checks').debug({ message: 'Checking environment variables' })

  if (NODE_ENV !== 'test' && !DATABASE_URL && (!DB_USER || !DB_PASSWORD || !DB_HOST))
    throw new AppError({
      name: 'DATABASE_CONFIG_MISSING',
      message: 'Database configuration is missing.',
      cause: {
        DATABASE_URL: DATABASE_URL ? 'Has value but is being treated as secure' : 'Missing',
        DB_USER: DB_USER ? DB_USER : 'Missing',
        DB_PASSWORD: DB_PASSWORD ? 'Has value but is being treated as secure' : 'Missing',
        DB_HOST: DB_HOST ? DB_HOST : 'Missing',
      },
    })

  if (NODE_ENV !== 'test' && !ADYEN_KEY)
    throw new AppError({
      name: 'ADYEN_CONFIG_MISSING',
      message: 'Adyen configuration is missing.',
      cause: {
        ADYEN_KEY: ADYEN_KEY ? 'Has value but is being treated as secure' : 'Missing',
      },
    })
}

export default checkEnv
