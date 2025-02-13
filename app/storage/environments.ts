import { EditorEnvironment } from "../components/Editor";

export function storeEnvironments(environments: EditorEnvironment[]) {
  console.log('Storage disabled - storeEnvironments:', environments);
}

export function getEnvironments(): EditorEnvironment[] {
  return [{
    name: "Default",
    url: "localhost:3009",
    metadata: "",
    interactive: false,
    tlsCertificate: {
      useServerCertificate: true,
      rootCert: { fileName: "", filePath: "" }
    }
  }];
}

export function clearEnvironments() {
  console.log('Storage disabled - clearEnvironments');
}

export function saveEnvironment(environment: EditorEnvironment) {
  console.log('Storage disabled - saveEnvironment:', environment);
}

export function deleteEnvironment(name: string) {
  console.log('Storage disabled - deleteEnvironment:', name);
}
