import { init } from '@paralleldrive/cuid2'
import { config, createLogger as createWinstonLogger, transports, format } from 'winston'
import { STOREREFPATTERN } from '@/constants.js'

export const createLogger = (context?: string) =>
  createWinstonLogger({
    levels: config.npm.levels,
    level: (process.env.LOG_LEVEL as string)?.toLowerCase() || 'info',
    defaultMeta: { context: context || 'jdna-sync' },
    transports: [new transports.Console({ forceConsole: true })],
    format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  })

export const logger = (context?: string) => {
  return createLogger(context)
}
export const cliLogger = logger('cli')
export const webLogger = logger('web')

export const parseStoreRef = (reference: string) => {
  const match = reference.match(STOREREFPATTERN)
  if (!match) return null

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, letters, numbers] = match
  return {
    prefix: letters,
    number: numbers,
  }
}

export const findDifference = (arr1: string[], arr2: string[]): string[] => {
  return arr1.filter((item) => !arr2.includes(item))
}

export const createRequestID = () => {
  return init({
    random: Math.random,
    length: 32,
  })()
}
