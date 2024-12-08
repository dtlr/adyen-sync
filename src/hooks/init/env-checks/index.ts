import { Hook } from '@oclif/core'
import { AdyenSyncError } from '@/error.js'
import 'dotenv/config'
import { logger } from '@/core/utils'

const checkEnv: Hook<'init'> = async function () {
  const {
    NODE_ENV,
    DATABASE_URL,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    ADYEN_KEY,
    ADYEN_KEY_TEST,
    ADYEN_KEY_LIVE,
  } = process.env

  logger('init-env-checks').debug({ message: 'Checking environment variables' })

  if (NODE_ENV !== 'test' && !DATABASE_URL && (!DB_USER || !DB_PASSWORD || !DB_HOST))
    throw new AdyenSyncError({
      name: 'DATABASE_CONFIG_MISSING',
      message: 'Database configuration is missing.',
      cause: {
        DATABASE_URL: DATABASE_URL ? 'Has value but is being treated as secure' : 'Missing',
        DB_USER: DB_USER ? DB_USER : 'Missing',
        DB_PASSWORD: DB_PASSWORD ? 'Has value but is being treated as secure' : 'Missing',
        DB_HOST: DB_HOST ? DB_HOST : 'Missing',
        DB_PORT: DB_PORT ? DB_PORT : 'Missing',
      },
    })

  if (NODE_ENV !== 'test' && !ADYEN_KEY && (!ADYEN_KEY_TEST || !ADYEN_KEY_LIVE))
    throw new AdyenSyncError({
      name: 'ADYEN_CONFIG_MISSING',
      message: 'Adyen configuration is missing.',
      cause: {
        ADYEN_KEY: ADYEN_KEY ? 'Has value but is being treated as secure' : 'Missing',
        ADYEN_KEY_TEST: ADYEN_KEY_TEST ? 'Has value but is being treated as secure' : 'Missing',
        ADYEN_KEY_LIVE: ADYEN_KEY_LIVE ? 'Has value but is being treated as secure' : 'Missing',
      },
    })
}

export default checkEnv
