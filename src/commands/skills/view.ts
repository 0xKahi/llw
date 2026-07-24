import { skillRegistry } from '../../constants';
import type { CommandStrategy } from '../../utils/commander/command-strategy';

type SkillsViewOptions = {
  path?: boolean;
};

export class SkillsViewCommand implements CommandStrategy {
  readonly config = {
    name: 'view',
    description: 'Output a bundled skill or its installed folder path',
    args: [{ name: '<name>', description: 'registered skill name or alias' }],
    options: [{ flag: '--path', description: 'output the absolute skill folder path' }],
  };

  execute(name: string, options: SkillsViewOptions): void {
    if (!skillRegistry.has(name)) {
      throw new Error(`Unknown skill: ${name}`);
    }

    if (options.path) {
      console.log(skillRegistry.getSkillPath(name));
      return;
    }

    process.stdout.write(skillRegistry.getSkill(name));
  }
}
