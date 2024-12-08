import { format } from 'node:util'
import { Interfaces } from '@oclif/core'
import winston from 'winston'

const cliCustomLevels = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  colors: {
    debug: 'blue',
    info: 'yellow',
    warn: 'magenta',
    error: 'red',
  },
}

export const customLogger = (namespace: string): Interfaces.Logger => {
  const myLogger = winston.createLogger({
    levels: cliCustomLevels.levels,
    level: 'info',
    defaultMeta: { context: namespace },
    transports: [new winston.transports.Console({ forceConsole: true })],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.splat(),
      winston.format.prettyPrint(),
    ),
  })
  return {
    child: (ns: string, delimiter?: string) => customLogger(`${namespace}${delimiter ?? ':'}${ns}`),
    debug: (formatter: unknown, ...args: unknown[]) => myLogger.debug(format(formatter, ...args)),
    error: (formatter: unknown, ...args: unknown[]) => myLogger.error(format(formatter, ...args)),
    info: (formatter: unknown, ...args: unknown[]) => myLogger.info(format(formatter, ...args)),
    trace: (formatter: unknown, ...args: unknown[]) => myLogger.debug(format(formatter, ...args)),
    warn: (formatter: unknown, ...args: unknown[]) => myLogger.warn(format(formatter, ...args)),
    namespace,
  }
}

export const logger = customLogger('jdna-sync')
