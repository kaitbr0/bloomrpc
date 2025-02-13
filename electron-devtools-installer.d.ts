declare module 'electron-devtools-installer' {
  export const REACT_DEVELOPER_TOOLS: string;
  export function installExtension(extensionId: string): Promise<string>;
} 
