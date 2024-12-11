import { Command, Flags, type Interfaces } from '@oclif/core'
import { APP_ENVS, LOG_LEVELS } from '@/constants.js'

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true

  static baseFlags = {
    'log-level': Flags.string({
      description: 'The log level to use',
      default: 'info',
      helpGroup: 'GLOBAL',
      env: 'LOG_LEVEL',
      options: LOG_LEVELS,
    }),
    'app-env': Flags.string({
      description: 'The app environment to use',
      aliases: ['env', 'e'],
      default: 'test',
      helpGroup: 'GLOBAL',
      env: 'APP_ENV',
      options: APP_ENVS,
    }),
  }

  protected flags!: Flags<T>
  protected args!: Args<T>

  public async init(): Promise<void> {
    await super.init()
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: this.ctor.strict,
    })
    this.flags = flags as Flags<T>
    this.args = args as Args<T>
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<unknown> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(err)
  }

  protected async finally(_: Error | undefined): Promise<unknown> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_)
  }
}
