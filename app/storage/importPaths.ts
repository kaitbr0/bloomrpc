// Temporarily disable electron-store
export function storeImportPaths(paths: string[]) {
  console.log('Storage disabled:', paths);
}

export function getImportPaths(): string[] {
  return [""];
}

export function clearImportPaths() {
  console.log('Storage clear disabled');
}
