import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { BundleCreateCommand } from './create';
import { BundleListCommand } from './list';
import { BundleRenameCommand } from './rename';
import { BundleSyncCommand } from './sync';
import { BundleTreeCommand } from './tree';
import { BundleUpdateCommand } from './update';
import { BundleViewCommand } from './view';

export class BundleCommand implements CommandStrategy {
  readonly config = {
    name: 'bundle',
    description: 'Knowledge Bundle Commands',
    subCommands: [
      new BundleListCommand(),
      new BundleTreeCommand(),
      new BundleViewCommand(),
      new BundleCreateCommand(),
      new BundleUpdateCommand(),
      new BundleSyncCommand(),
      new BundleRenameCommand(),
    ],
  };
}
