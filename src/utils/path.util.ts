import { existsSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import path from 'node:path';

const SHELL_VAR_REGEX = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

export type FileSearchResult = {
  exists: boolean;
  path: string;
};

export class PathUtil {
  /**
   * Expand shell-style variables in a path string.
   * Supports: `~`, `$HOME`, `$USER`, `$VAR`, `${VAR}`.
   */
  static expandPath(rawPath: string): string {
    let result = rawPath;

    result = result.replace(SHELL_VAR_REGEX, (_match, braced, bare) => {
      const name = braced ?? bare;
      if (name === 'HOME') return homedir();
      if (name === 'USER') return userInfo().username;
      return process.env[name] ?? _match;
    });

    if (result === '~' || result.startsWith('~/') || result.startsWith('~\\')) {
      result = path.join(homedir(), result.slice(1));
    }

    return result;
  }

  static findFile(filePath: string): FileSearchResult {
    if (existsSync(filePath)) {
      return { exists: true, path: filePath };
    }
    return { exists: false, path: filePath };
  }
}
