import { editorStore } from './editor';
import { Certificate } from "../behaviour";

const KEYS = {
  TLS_CERTIFICATES: 'certificates',
  TLS_CONFIG: 'tls_config'
} as const;

export interface TLSConfig {
  rootCert?: string;
  privateKey?: string;
  certChain?: string;
}

export function storeTLSList(certs: Certificate[]) {
  editorStore.set(KEYS.TLS_CERTIFICATES, certs);
}

export function getTLSList() {
  return editorStore.get(KEYS.TLS_CERTIFICATES) || [{
    useServerCertificate: true,
    rootCert: { fileName: "Server Certificate", filePath: "" },
  }];
}

export function storeTLSClientConfig(config: TLSConfig) {
  editorStore.set(KEYS.TLS_CONFIG, config);
}

export function getTLSClientConfig(): TLSConfig {
  return editorStore.get(KEYS.TLS_CONFIG) || {};
}

export function clearTLS() {
  editorStore.delete(KEYS.TLS_CERTIFICATES);
  editorStore.delete(KEYS.TLS_CONFIG);
}
