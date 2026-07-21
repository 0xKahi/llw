import type { CommandOptionsProps } from '../utils/commander/command-strategy';
import type { ObjectValues } from './common.type';

export const OUTPUT_FORMAT_OPTIONS = {
  json: 'json',
  toon: 'toon',
} as const;

export type OutputFormat = ObjectValues<typeof OUTPUT_FORMAT_OPTIONS>;
export type FormatOpt = {
  format: string;
  compact?: boolean;
};

export const OUTPUT_FORMAT_COMMAND_OPT_FLAGS: CommandOptionsProps[] = [
  {
    flag: `--format -f <${Object.values(OUTPUT_FORMAT_OPTIONS).join('|')}>`,
    description: `output format (default: ${OUTPUT_FORMAT_OPTIONS.toon})`,
    default: OUTPUT_FORMAT_OPTIONS.toon,
  },
  {
    flag: '--compact -c',
    description: 'compact output (default: true)',
    default: true,
  },
  {
    flag: '--no-compact',
    description: 'dont compact output (optional)',
  },
];
