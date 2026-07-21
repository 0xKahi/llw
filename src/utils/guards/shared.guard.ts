import { OUTPUT_FORMAT_OPTIONS, type OutputFormat } from '../../types/output-format-options.type';

export class SharedGuard {
  static validateOutputFormat(format: string): { valid: boolean; format: OutputFormat } {
    const validFormat = Object.values(OUTPUT_FORMAT_OPTIONS).find(value => value === format);
    if (!validFormat) {
      console.error(`Error: invalid output format "${format}", must be one of ${Object.values(OUTPUT_FORMAT_OPTIONS)}`);
      return { valid: false, format: 'toon' };
    }
    return { valid: true, format: validFormat };
  }
}
