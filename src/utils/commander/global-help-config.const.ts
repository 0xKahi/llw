import { dye } from '@0xkahi/cli-dye';
import type { HelpConfiguration } from 'commander';

export const GlobalHelpConfig: HelpConfiguration = {
  styleTitle: str => dye.bold(str),
  styleCommandText: str => dye.colorize(str, { fg: 'green' }),
  styleCommandDescription: str => dye.colorize({ fg: 'cyan' }).bold(str),
  styleOptionText: str => dye.colorize(str, { fg: 'white' }),
  styleArgumentText: str => dye.colorize(str, { fg: 'yellow' }),
  styleSubcommandText: str => dye.colorize(str, { fg: 'green' }),
};
