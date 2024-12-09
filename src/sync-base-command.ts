import { Command, Flags, Interfaces } from '@oclif/core'
import { JDNAProperty } from './constants.js'
import { BaseCommand } from './base-command.js'
import { createId } from '@paralleldrive/cuid2'

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof SyncBaseCommand)['baseFlags'] & T['flags']
>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

export abstract class SyncBaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true

  static baseFlags = {
    ...BaseCommand.baseFlags,
    requestId: Flags.string({
      description: 'The request ID',
      hidden: true,
      default: createId(),
      required: true,
    }),
    banner: Flags.string({
      aliases: ['brand', 'fascia'],
      description: 'The banner to sync',
      char: 'b',
      multiple: false,
      default: 'all',
      options: [...Object.keys(JDNAProperty), 'all'] as const,
      required: true,
    }),
    local: Flags.boolean({
      description: 'Sync data to local database',
      char: 'l',
      default: false,
      hidden: true,
    }),
    full: Flags.boolean({
      description: 'Re-sync all data',
      char: 'f',
      default: false,
    }),
  }

  protected flags!: Flags<T>
  protected args!: Args<T>

  public async init(): Promise<void> {
    await super.init()
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof SyncBaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: this.ctor.strict,
    })
    await this.config.runHook('migration', {
      requestId: flags.requestId,
      id: 'sync-command',
    })
    this.flags = flags as Flags<T>
    this.args = args as Args<T>
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(err)
  }

  protected async finally(_: Error | undefined): Promise<any> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_)
  }
}
