import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { ConceptCreateCommand } from './create';
import { ConceptOpenCommand } from './open';
import { ConceptUpdateCommand } from './update';
import { ConceptViewCommand } from './view';

export class ConceptCommand implements CommandStrategy {
  readonly config = {
    name: 'concept',
    description: 'Knowledge Bundle Concept Commands',
    subCommands: [new ConceptViewCommand(), new ConceptCreateCommand(), new ConceptUpdateCommand(), new ConceptOpenCommand()],
  };
}
