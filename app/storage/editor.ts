declare global {
  interface Window {
    electronStore: any;
  }
}

export let editorStore: any;

if (process.type === 'renderer') {
  editorStore = window.electronStore;
}

import { ProtoFile } from '../behaviour';
import { EditorTabs } from '../components/BloomRPC';
import { EditorRequest } from '../components/Editor';
import { EditorTabRequest } from "../components/TabList";

const KEYS = {
  URL: "url",
  PROTOS: "protos",
  TABS: "tabs",
  REQUESTS: "requests",
  INTERACTIVE: "interactive",
  METADATA: "metadata",
};

export interface EditorTabsStorage {
  activeKey: string,
  tabs: {
    protoPath: string,
    methodName: string,
    serviceName: string,
    tabKey: string
  }[]
}

// Stub functions
export function storeUrl(url: string) {
  console.log('Storage disabled - storeUrl:', url);
}

export function getUrl(): string | void {
  return undefined;
}

export function storeProtos(protos: any[]) {
  console.log('Storage disabled - storeProtos:', protos);
}

export function getProtos(): string[] | void {
  return [];
}

export function storeTabs(editorTabs: any) {
  console.log('Storage disabled - storeTabs:', editorTabs);
}

export function getTabs(): EditorTabsStorage | void {
  return {
    activeKey: "0",
    tabs: []
  };
}

export function storeRequestInfo(info: any) {
  console.log('Storage disabled - storeRequestInfo:', info);
}

export function getRequestInfo(tabKey: string) {
  return undefined;
}

export function deleteRequestInfo(tabKey: string) {
  console.log('Storage disabled - deleteRequestInfo:', tabKey);
}

export function clearEditor() {
  console.log('Storage disabled - clearEditor');
}

// TODO FIX THIS 
export function getMetadata(): string {
  return "";
}

export function storeMetadata(metadata: string) {
  console.log('Storage disabled - storeMetadata:', metadata);
}


