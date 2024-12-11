import { SyncBaseCommand } from '@/base-cmds/sync-base-command.js'

export class SyncCommand extends SyncBaseCommand<typeof SyncCommand> {
  static description = 'Sync data to/from JDNA or other services'

  async run(): Promise<void> {}
}
