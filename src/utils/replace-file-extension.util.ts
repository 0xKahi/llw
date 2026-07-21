export function replaceFileExtension({ fileName, extension }: { fileName: string; extension: string }): string {
  if (fileName.endsWith(extension)) {
    return fileName.slice(0, -extension.length);
  }
  return fileName;
}
