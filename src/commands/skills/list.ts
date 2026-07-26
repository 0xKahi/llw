import { dye } from '@0xkahi/cli-dye';
import { skillRegistry } from '../../constants';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { formatOutput } from '../../utils/tokenizer.util';

type SkillsListOptions = {
  json?: boolean;
};

export class SkillsListCommand implements CommandStrategy {
  readonly config = {
    name: 'list',
    alias: 'ls',
    description: 'List all available skills',
    options: [{ flag: '--json', description: 'output skills list as json' }],
  };

  async execute(opts: SkillsListOptions): Promise<void> {
    const { json } = opts;

    const skillData: { name: string; alias: string | null; description: string; path: string }[] = [];
    for (const [skillName, entry] of skillRegistry.entries.entries()) {
      skillData.push({
        name: skillName,
        alias: entry?.alias ?? null,
        description: entry.description,
        path: skillRegistry.getSkillPath(skillName),
      });
    }

    if (json) {
      const output = formatOutput({ skills: skillData }, { type: 'json', compact: false });
      console.log(output);
      return;
    }

    const skillLines: string[] = [];
    for (const data of skillData) {
      const newLines = [
        dye.colorize(data.name, { fg: 'green' }),
        '────────────────────────────────────────────────────────────',
        `alias: ${dye.colorize(data?.alias ?? 'null', { fg: 'yellow' })}`,
        `description: ${dye.dim(data.description)}`,
        `path: ${dye.colorize({ fg: 'cyan' }).underline(data.path)}`,
        '',
      ];
      skillLines.push(...newLines);
    }

    const lines = [
      dye.colorize({ fg: 'magenta' }).bold(`LLW SKILLS`),
      '',
      // '════════════════════════════════════════════════════════════',
      ...skillLines,
      // '════════════════════════════════════════════════════════════',
    ];
    console.log(lines.join('\n'));
  }
}
