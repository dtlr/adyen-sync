import { config, createLogger as createWinstonLogger, transports, format } from 'winston'

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
