import { createLogger, transports, format } from 'winston'
import { config } from 'winston'

export const posWrkIds = ['21', '22', '23', '24', '25', '26', '27', '28', '29']

export const storeRefPattern = /^([A-Z]+)(\d+)$/

export const logger = createLogger({
  levels: config.syslog.levels,
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'adyen-sync' },
  transports: [new transports.Console({ forceConsole: true })],
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
})

export const parseStoreRef = (reference: string) => {
  const match = reference.match(storeRefPattern)
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
