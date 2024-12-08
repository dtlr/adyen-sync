import { Interfaces } from '@oclif/core'
import winston, { Logger, format } from 'winston'

export const customLogger = (namespace: string): Interfaces.Logger => {
  const myLogger = new Logger({
    level: 'info',
    defaultMeta: { service: namespace },
    format: winston.format.json(),
  })
  return {
    child: (ns: string, delimiter?: string) => customLogger(`${namespace}${delimiter ?? ':'}${ns}`),
    debug: (formatter: unknown, ...args: unknown[]) => myLogger.debug(format(formatter, ...args)),
    error: (formatter: unknown, ...args: unknown[]) => myLogger.error(format(formatter, ...args)),
    info: (formatter: unknown, ...args: unknown[]) => myLogger.info(format(formatter, ...args)),
    trace: (formatter: unknown, ...args: unknown[]) => myLogger.trace(format(formatter, ...args)),
    warn: (formatter: unknown, ...args: unknown[]) => myLogger.warn(format(formatter, ...args)),
    namespace,
  }
}

export const logger = customLogger('adyen-sync')
