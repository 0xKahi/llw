import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { JevBundleSearchCommand } from './bundle-search';
import { JevSearchCommand } from './search';
import { JevStatusCommand } from './status';

export class JevCommand implements CommandStrategy {
  readonly config = {
    name: 'jev',
    description: 'Ask TypeSafe Jev questions about the Knowledge Base',
    subCommands: [new JevBundleSearchCommand(), new JevSearchCommand(), new JevStatusCommand()],
  };
}
