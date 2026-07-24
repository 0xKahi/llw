import type { CommandOptionsProps } from '../utils/commander/command-strategy';
import type { ObjectValues } from './common.type';

export const OUTPUT_FORMAT_OPTIONS = {
  json: 'json',
  toon: 'toon',
} as const;

export type OutputFormat = ObjectValues<typeof OUTPUT_FORMAT_OPTIONS>;
export type FormatOpt = {
  format: string;
  pretty?: boolean;
};

export const OUTPUT_FORMAT_COMMAND_OPT_FLAGS: CommandOptionsProps[] = [
  {
    flag: `--format -f <${Object.values(OUTPUT_FORMAT_OPTIONS).join('|')}>`,
    description: `output format (default: ${OUTPUT_FORMAT_OPTIONS.toon})`,
    default: OUTPUT_FORMAT_OPTIONS.toon,
  },
  {
    flag: '--pretty',
    description: 'pretty-print output (optional)',
  },
];
