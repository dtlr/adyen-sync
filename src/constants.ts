export const POSWRKIDS = ['21', '22', '23', '24', '25', '26', '27', '28', '29']

export const STOREREFPATTERN = /^([A-Z]+)(\d+)$/

export const JDNAProperty = ['dtlr', 'spc'] as const

export const LOG_LEVELS = [
  'debug',
  'DEBUG',
  'info',
  'INFO',
  'warn',
  'WARN',
  'error',
  'ERROR',
] as const

export const APP_ENVS = ['live', 'LIVE', 'test', 'TEST', 'prod', 'PROD', 'dev', 'DEV'] as const
