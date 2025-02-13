import * as protobuf from 'protobufjs';
import * as path from 'path';
import { ProtoFile, ProtoService } from './protobuf';
import { Service } from 'protobufjs';
import {Client} from 'grpc-reflection-js';
import {credentials} from '@grpc/grpc-js';
import isURL from 'validator/lib/isURL';
import { ipcRenderer } from 'electron';
import * as fs from 'fs';

type Proto = protobuf.Root;

const commonProtosPath = [
  path.join(__dirname, '..', 'static')
];

export type OnProtoUpload = (protoFiles: ProtoFile[], err?: Error) => void

/**
 * Upload protofiles
 * @param onProtoUploaded
 * @param importPaths
 */
export async function importProtos(onProtoUploaded?: OnProtoUpload, importPaths?: string[]): Promise<string[]> {
  try {
    console.log('Renderer: Calling open-file-dialog');
    const filePaths = await ipcRenderer.invoke('open-file-dialog');
    console.log('Renderer: Got result:', filePaths);
    
    if (filePaths && onProtoUploaded) {
      await loadProtosFromFile(filePaths, importPaths, onProtoUploaded);
    }
    
    return filePaths || [];
  } catch (e) {
    console.error('Error importing protos:', e, e.stack);
    if (onProtoUploaded) {
      onProtoUploaded([], e as Error);
    }
    return [];
  }
}

/**
 * Upload protofiles from gRPC server reflection
 * @param onProtoUploaded
 * @param host
 */
export async function importProtosFromServerReflection(onProtoUploaded: OnProtoUpload, host: string) {
  await loadProtoFromReflection(host, onProtoUploaded);
}

/**
 * Load protocol buffer files
 * @param filePaths
 * @param importPaths
 * @param onProtoUploaded
 */
export async function loadProtos(protoPaths: string[], importPaths?: string[], onProtoUploaded?: OnProtoUpload): Promise<ProtoFile[]> {
  let validateOptions = {
    require_tld: false,
    require_protocol: false,
    require_host: false,
    require_valid_protocol: false,
  }
  const protoUrls = protoPaths.filter((protoPath) => {
    return isURL(protoPath, validateOptions);
  })

  const protoFiles = protoPaths.filter((protoPath) => {
    return !isURL(protoPath, validateOptions);
  })

  const protoFileFromFiles = await loadProtosFromFile(protoFiles, importPaths, onProtoUploaded);

  let protoFileFromReflection: ProtoFile[] = [];
  for (const protoUrl of protoUrls) {
    protoFileFromReflection = protoFileFromReflection.concat(await loadProtoFromReflection(protoUrl, onProtoUploaded));
  }

  return protoFileFromFiles.concat(protoFileFromReflection);
}

/**
 * Load protocol buffer files from gRPC server reflection
 * @param host
 * @param onProtoUploaded
 */
export async function loadProtoFromReflection(host: string, onProtoUploaded?: OnProtoUpload): Promise<ProtoFile[]> {
  try {
    const reflectionClient = new Client(host, credentials.createInsecure());
    const services = (await reflectionClient.listServices()) as string[];
    const serviceRoots = await Promise.all(
        services
            .filter(s => s && s !== 'grpc.reflection.v1alpha.ServerReflection')
            .map((service: string) => reflectionClient.fileContainingSymbol(service))
    );

    const protos = serviceRoots.map((root) => ({
      proto: root as unknown as protobuf.Root,
      fileName: root.files[root.files.length - 1],
      services: parseServices(root as unknown as protobuf.Root)
    }));

    onProtoUploaded && onProtoUploaded(protos, undefined);
    return protos;

  } catch (e) {
    console.error(e);
    onProtoUploaded && onProtoUploaded([], e);

    if (!onProtoUploaded) {
      throw e;
    }

    return []
  }
}

/**
 * Load protocol buffer files from proto files
 * @param filePaths
 * @param importPaths
 * @param onProtoUploaded
 */
export async function loadProtosFromFile(filePaths: string[], importPaths?: string[], onProtoUploaded?: OnProtoUpload): Promise<ProtoFile[]> {
  try {
    console.log('Loading proto files:', filePaths);
    const protos = await Promise.all(filePaths.map(async (fileName) => {
      const root = new protobuf.Root();
      root.resolvePath = (origin, target) => {
        const paths = [...(importPaths || []), ...commonProtosPath];
        for (const importPath of paths) {
          const fullPath = path.join(importPath, target);
          if (fs.existsSync(fullPath)) {
            return fullPath;
          }
        }
        return target;
      };
      const content = await fs.promises.readFile(fileName, 'utf8');
      console.log('Proto content:', content.substring(0, 100) + '...'); // Show start of file
      const parsed = protobuf.parse(content, root, {
        keepCase: true,
        alternateCommentMode: true,
        preferTrailingComment: true
      });
      console.log('Parsed proto:', parsed);
      return parsed;
    }));

    const protoList = protos.reduce((list: ProtoFile[], proto: any) => {
      console.log('Processing proto:', proto);
      const services = parseServices(proto.root);
      console.log('Found services:', services);
      list.push({
        proto: proto.root,
        fileName: path.basename(filePaths[protos.indexOf(proto)]),
        services,
      });
      return list;
    }, []);

    console.log('Final proto list:', protoList);
    onProtoUploaded && onProtoUploaded(protoList, undefined);
    return protoList;
  } catch (e) {
    console.error('Error loading protos:', e);
    onProtoUploaded && onProtoUploaded([], e as Error);
    if (!onProtoUploaded) {
      throw e;
    }
    return [];
  }
}

/**
 * Parse Grpc services from root
 * @param proto
 */
function parseServices(proto: Proto) {
  const services: {[key: string]: ProtoService} = {};
  console.log('Parsing services from proto:', proto);

  // Handle nested services
  if (proto.nested) {
    Object.entries(proto.nested).forEach(([name, service]) => {
      if (service && 'methods' in service) {
        console.log('Found service:', name);
        services[name] = {
          serviceName: name,
          proto,
          methodsMocks: {},
          methodsName: Object.keys(service.methods || {}),
        };
      }

      // Check nested packages
      if (service && typeof service === 'object' && 'nested' in service) {
        Object.entries(service.nested || {}).forEach(([nestedName, nestedService]) => {
          if (nestedService && 'methods' in nestedService) {
            console.log('Found nested service:', `${name}.${nestedName}`);
            services[`${name}.${nestedName}`] = {
              serviceName: `${name}.${nestedName}`,
              proto,
              methodsMocks: {},
              methodsName: Object.keys(nestedService.methods || {}),
            };
          }
        });
      }
    });
  }

  console.log('Parsed services:', services);
  return services;
}

export function importResolvePath(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ipcRenderer.invoke('open-directory-dialog');
      if (!result || !result.length) {
        return reject("No folder selected");
      }
      resolve(result[0]);
    } catch (e) {
      reject(e);
    }
  });
}
