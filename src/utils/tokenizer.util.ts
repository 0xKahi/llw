import { encode } from '@toon-format/toon';

type JsonFormatOpt = {
  type: 'json';
  compact?: boolean;
};

type ToonFormatOpt = {
  type: 'toon';
  compact?: boolean;
  replacer?: (key: string, value: unknown) => unknown;
};

export function formatOutput(data: Record<string, unknown>, options: JsonFormatOpt | ToonFormatOpt): string {
  switch (options.type) {
    case 'json':
      return formatAsJson(data, options.compact);
    case 'toon':
      return formatAsToon(data, options);
  }
}

function formatAsToon(data: Record<string, unknown>, { compact, replacer }: Omit<ToonFormatOpt, 'type'>): string {
  if (compact) {
    const toonReplacer = replacer ?? toonCompactReplacer;
    return encode(data, { keyFolding: 'safe', replacer: toonReplacer });
  }
  return encode(data, replacer ? { replacer } : undefined);
}

function formatAsJson(data: Record<string, unknown>, compact?: boolean): string {
  if (compact) {
    return JSON.stringify(data, null);
  }
  return JSON.stringify(data, null, 2);
}

function toonCompactReplacer(_key: string, value: unknown): unknown {
  if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
    return value.length > 0 ? `arr(${value.length})<${value.join('|')}>` : null;
    // return value.length > 0 ? `arr<${value.length}>(${value.join('|')})` : null;
  }
  return value;
}
