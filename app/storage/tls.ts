// @ts-ignore
import * as Store from "electron-store";
import { Certificate } from "../behaviour";

// const TLSStore = new Store({
//   name: "tls",
// });


// const TLS_KEYS = {
//   CERTIFICATES: 'certificates'
// };


export interface TLSConfig {
  rootCert?: string;
  privateKey?: string;
  certChain?: string;
}

export function storeTLSList(certs: Certificate[]) {
  console.log('Storage disabled - storeTLSList:', certs);
}

export function getTLSList() {
  const serverCertificate = {
    useServerCertificate: true,
    rootCert: { fileName: "Server Certificate", filePath: "" },
  };
  return [serverCertificate];
}

export function storeTLSClientConfig(config: TLSConfig) {
  console.log('Storage disabled - storeTLSClientConfig:', config);
}

export function getTLSClientConfig(): TLSConfig {
  return {};
}

export function clearTLS() {
  console.log('Storage disabled - clearTLS');
}
