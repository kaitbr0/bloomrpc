import { editorStore } from './editor';

const KEYS = {
  IMPORT_PATH: "paths"
} as const;

export function storeImportPaths(paths: string[]) {
  editorStore.set(KEYS.IMPORT_PATH, paths);
}

export function getImportPaths(): string[] {
  return editorStore.get(KEYS.IMPORT_PATH) || [];
}

export function clearImportPaths() {
  editorStore.delete(KEYS.IMPORT_PATH);
}
