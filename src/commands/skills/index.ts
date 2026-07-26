import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { SkillsListCommand } from './list';
import { SkillsViewCommand } from './view';

export class SkillsCommand implements CommandStrategy {
  readonly config = {
    name: 'skills',
    description: 'Bundled Agent Skill Commands',
    subCommands: [new SkillsViewCommand(), new SkillsListCommand()],
  };
}
