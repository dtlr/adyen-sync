import propertyData from './property.json' assert { type: 'json' }

interface PropertyData {
  [key: string]: string
}

export const POSWRKIDS = ['21', '22', '23', '24', '25', '26', '27', '28', '29']

export const STOREREFPATTERN = /^([A-Z]+)(\d+)$/

export const JDNAProperty: PropertyData = propertyData
export type JDNAPropertyKey = keyof typeof propertyData

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

export const APP_ENVS = ['live', 'test', 'prod', 'dev'] as const
