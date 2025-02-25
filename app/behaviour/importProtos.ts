import { Root, Service, parse } from 'protobufjs';
import * as path from 'path';
import { Proto, ProtoFile, ProtoService } from './protobuf';
import { Client } from 'grpc-reflection-js';
import { credentials } from '@grpc/grpc-js';
import isURL from 'validator/lib/isURL';
import { ipcRenderer } from 'electron';
import * as fs from 'fs';
import { load } from '@grpc/proto-loader';
import { loadPackageDefinition } from '@grpc/grpc-js';

const commonProtosPath = [
    // @ts-ignore
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
    const filePaths = await ipcRenderer.invoke('open-file-dialog');
    
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
  console.log('Loading proto files:', protoPaths);
  let validateOptions = {
    require_tld: false,
    require_protocol: false,
    require_host: false,
    require_valid_protocol: false,
  }
  const protoUrls = protoPaths.filter((protoPath) => {
    return isURL(protoPath, validateOptions);
  })
  console.log('Proto URLs:', protoUrls);

  const protoFiles = protoPaths.filter((protoPath) => {
    return !isURL(protoPath, validateOptions);
  })
  console.log('Proto files:', protoFiles);

  const protoFileFromFiles = await loadProtosFromFile(protoFiles, importPaths, onProtoUploaded);
  console.log('Proto files from files:', protoFileFromFiles);

  let protoFileFromReflection: ProtoFile[] = [];
  for (const protoUrl of protoUrls) {
    protoFileFromReflection = protoFileFromReflection.concat(await loadProtoFromReflection(protoUrl, onProtoUploaded));
  }
  console.log('Proto files from reflection:', protoFileFromReflection);

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
      proto: root as unknown as Root,
      fileName: root.files[root.files.length - 1],
      services: parseServices(root as Root)
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
    const protos = await Promise.all(filePaths.map(async (fileName) => {
      // Load the proto file using proto-loader for gRPC client
      const packageDefinition = await load(fileName, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [...(importPaths || []), ...commonProtosPath]
      });

      console.log('Package definition loaded:', {
        hasPackage: !!packageDefinition,
        keys: Object.keys(packageDefinition)
      });

      // Generate the gRPC service definitions
      const ast = loadPackageDefinition(packageDefinition);
      console.log('AST generated:', {
        hasAst: !!ast,
        keys: Object.keys(ast),
        hasBackend: !!ast.backend,
        services: ast.backend ? Object.keys(ast.backend) : []
      });
      
      // Create the root for protobuf.js (for method definitions)
      const root = new Root();
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
      const parsed = parse(content, root, {
        keepCase: true,
        alternateCommentMode: true,
        preferTrailingComment: true
      });

      // Attach AST to the root object
      (parsed.root as Proto).ast = ast;
      console.log('After attaching AST:', {
        hasAst: !!(parsed.root as Proto).ast,
        serviceName: 'backend.CDN' in ast ? 'Found service' : 'No service'
      });

      return {
        root: parsed.root,
        ast
      };
    }));

    const protoList = protos.reduce((list: ProtoFile[], proto: any) => {
      const services = parseServices(proto.root);
      list.push({
        proto: {
          ast: proto.ast,
          ...proto.root,
        } as Proto,
        fileName: path.basename(filePaths[protos.indexOf(proto)]),
        services,
      });
      return list;
    }, []);

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
function walkServices(proto: Proto, onService: (service: Service, root: Proto, serviceName: string) => void) {
  if (proto.nested) {
    Object.keys(proto.nested).forEach(key => {
      // @ts-ignore
      const obj = proto.nested[key];
      if (obj instanceof Service) {
        onService(obj, proto, key);
      } else if (obj.nested) {  // Handle nested namespaces
        // Recursively walk through nested namespaces
        Object.keys(obj.nested).forEach(nestedKey => {
          const nestedObj = obj.nested[nestedKey];
          if (nestedObj instanceof Service) {
            onService(nestedObj, proto, `${key}.${nestedKey}`);
          }
        });
      }
    });
  }
}

function parseServices(proto: Proto) {
  const services: {[key: string]: ProtoService} = {};
  console.log('parseServices input:', {
    hasAst: !!proto.ast,
    services: Object.keys(proto.ast || {})
  });

  walkServices(proto, (service: Service, _, serviceName: string) => {
    services[serviceName] = {
      serviceName: serviceName,
      proto: proto,
      methodsMocks: {},
      methodsName: Object.keys(service.methods || {}),
    };
  });
  console.log('parseServices output:', {
    serviceNames: Object.keys(services),
    firstService: services[Object.keys(services)[0]]?.proto.ast ? 'Has AST' : 'No AST'
  });
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
