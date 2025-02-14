import { editorStore } from './editor';
import { EditorEnvironment } from "../components/Editor";

const KEYS = {
  ENVIRONMENTS: "environments"
} as const;

const DEFAULT_ENVIRONMENT: EditorEnvironment = {
  name: "Default",
  url: "localhost:3009",
  metadata: "",
  interactive: false,
  tlsCertificate: {
    useServerCertificate: true,
    rootCert: { fileName: "", filePath: "" }
  }
};

export function storeEnvironments(environments: EditorEnvironment[]) {
  editorStore.set(KEYS.ENVIRONMENTS, environments);
}

export function getEnvironments(): EditorEnvironment[] {
  if (!editorStore) {
    return [DEFAULT_ENVIRONMENT];
  }
  return editorStore.get(KEYS.ENVIRONMENTS) || [DEFAULT_ENVIRONMENT];
}

export function clearEnvironments() {
  editorStore.delete(KEYS.ENVIRONMENTS);
}

export function saveEnvironment(environment: EditorEnvironment) {
  const environments = getEnvironments();
  const index = environments.findIndex(e => e.name === environment.name);
  if (index >= 0) {
    environments[index] = environment;
  } else {
    environments.push(environment);
  }
  storeEnvironments(environments);
}

export function deleteEnvironment(name: string) {
  const environments = getEnvironments().filter(e => e.name !== name);
  storeEnvironments(environments);
}
