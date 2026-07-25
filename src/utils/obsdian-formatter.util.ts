export type ObsidianTaskStatus = 'pending' | 'completed' | 'ignored';

export class ObsidianFormatter {
  static getTasksStatusSymbol(status: ObsidianTaskStatus): string {
    switch (status) {
      case 'pending':
        return ' ';
      case 'completed':
        return 'x';
      case 'ignored':
        return '-';
      default:
        throw new Error(`Unknown Obsidian task status: ${status}`);
    }
  }

  static parseInputToTagProperty(tags: string): string {
    const tagList = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => `"${tag}"`);
    const tagValue = `[${tagList.join(',')}]`;
    return tagValue;
  }
}
