declare global {
  interface Window {
    electronAPI: {
      store: any;
      getItem: (key: string) => any;
      setItem: (key: string, value: any) => void;
      deleteItem: (key: string) => void;
    }
  }
}

export let editorStore: any;

if (process.type === 'renderer') {
  console.log('Initializing editor store in renderer process');
  // Create a store-like interface using the API
  editorStore = {
    get: (key: string) => window.electronAPI?.getItem(key),
    set: (key: string, value: any) => window.electronAPI?.setItem(key, value),
    delete: (key: string) => window.electronAPI?.deleteItem(key),
    clear: () => {
      Object.keys(KEYS).forEach(key => 
        window.electronAPI?.deleteItem(KEYS[key as keyof typeof KEYS])
      );
    }
  };
} else {
  console.log('Initializing editor store in main process');
  const Store = require('electron-store');
  editorStore = new Store();
}

// Add immediate check
console.log('Editor store initialized:', editorStore);

// Only keep imports that are used in type definitions or functions
import type { EditorTabs } from '../components/BloomRPC';  // Used in storeTabs parameter type
import { ProtoFile } from '../behaviour';

const KEYS = {
  URL: "url",
  PROTOS: "protos",
  TABS: "tabs",
  REQUESTS: "requests",
  INTERACTIVE: "interactive",
  METADATA: "metadata",
} as const;

export interface EditorTabsStorage {
  activeKey: string,
  tabs: {
    protoPath: string,
    methodName: string,
    serviceName: string,
    tabKey: string
  }[]
}

// Remove all the console.log stubs and restore real functionality
export function storeUrl(url: string) {
  if (!editorStore) return;
  editorStore.set(KEYS.URL, url);
}

export function getUrl(): string | void {
  if (!editorStore) return;
  return editorStore.get(KEYS.URL);
}

export function storeProtos(protos: ProtoFile[]) {
  if (!editorStore) return;
  console.log('Storing protos, AST before storage:', protos[0].proto.ast);
  const storedProtos = protos.map(p => ({
    fileName: p.fileName,
    services: p.services,
    proto: {
      ...p.proto,
      ast: p.proto.ast  // Make sure AST is explicitly included
    }
  }));
  console.log('Protos after preparing for storage:', storedProtos[0].proto.ast);
  editorStore.set(KEYS.PROTOS, storedProtos);
}

export function getProtos(): ProtoFile[] | void {
  if (!editorStore) return;
  const stored = editorStore.get(KEYS.PROTOS) as ProtoFile[];  // Add type assertion
  console.log('Retrieved protos from storage:', stored);
  return stored;
}

export function storeTabs(editorTabs: EditorTabs) {
  if (!editorStore) return;
  editorStore.set(KEYS.TABS, editorTabs);
}

export function getTabs(): EditorTabsStorage | void {
  if (!editorStore) return;
  return editorStore.get(KEYS.TABS);
}

export function storeRequestInfo(info: any) {
  if (!editorStore) return;
  editorStore.set(`${KEYS.REQUESTS}.${info.tabKey}`, info);
}

export function getRequestInfo(tabKey: string) {
  if (!editorStore) return;
  return editorStore.get(`${KEYS.REQUESTS}.${tabKey}`);
}

export function deleteRequestInfo(tabKey: string) {
  if (!editorStore) return;
  editorStore.delete(`${KEYS.REQUESTS}.${tabKey}`);
}

export function clearEditor() {
  if (!editorStore) return;
  editorStore.clear();
}

export function getMetadata(): string {
  if (!editorStore) return "";
  return editorStore.get(KEYS.METADATA) || "";
}

export function storeMetadata(metadata: string) {
  if (!editorStore) return;
  editorStore.set(KEYS.METADATA, metadata);
}


