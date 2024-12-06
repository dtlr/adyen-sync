import { createLogger, transports, format } from 'winston'
import { config } from 'winston'
import { STOREREFPATTERN } from './constants'
import { init } from '@paralleldrive/cuid2'

export const logger = createLogger({
  levels: config.syslog.levels,
  level: (process.env.LOG_LEVEL as string)?.toLowerCase() || 'info',
  defaultMeta: { service: 'adyen-sync' },
  transports: [new transports.Console({ forceConsole: true })],
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
})

export const parseStoreRef = (reference: string) => {
  const match = reference.match(STOREREFPATTERN)
  if (!match) return null

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
