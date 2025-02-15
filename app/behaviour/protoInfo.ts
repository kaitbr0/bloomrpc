// @ts-ignore
import * as lodashGet from 'lodash.get';
import { ProtoService } from './protobuf';

export class ProtoInfo {
  service: ProtoService;
  methodName: string;

  constructor(service: ProtoService, methodName: string) {
    this.service = service;
    this.methodName = methodName;
  }

  client(): any {
    console.log('Looking for service client:', {
      serviceName: this.service.serviceName,
      hasAst: !!this.service.proto.ast,
      pkg: this.service.serviceName.split('.').slice(0, -1).join('.'),
      serviceNamePart: this.service.serviceName.split('.').slice(-1).join('.'),
      pkgExists: !!lodashGet(this.service.proto.ast, this.service.serviceName.split('.').slice(0, -1).join('.')),
      pkgKeys: lodashGet(this.service.proto.ast, this.service.serviceName.split('.').slice(0, -1).join('.')) ? Object.keys(lodashGet(this.service.proto.ast, this.service.serviceName.split('.').slice(0, -1).join('.'))) : []
    });

    // Try direct access first
    const [pkg, serviceName] = this.service.serviceName.split('.');
    const service = this.service.proto.ast?.[pkg]?.[serviceName];
    console.log('Found service:', service);
    if (service) {
      return service;
    }

    throw new Error(`Service ${this.service.serviceName} not found in AST. Available services: ${Object.keys(this.service.proto.ast || {}).join(', ')}`);
  }

  serviceDef() {
    return this.service.proto.root.lookupService(this.service.serviceName);
  }

  methodDef() {
    const serviceDefinition = this.serviceDef();
    return serviceDefinition.methods[this.methodName];
  }

  isClientStreaming() {
    const method = this.methodDef();
    return method && method.requestStream;
  }

  isServerStreaming() {
    const method = this.methodDef();
    return method && method.responseStream;
  }

  isBiDirectionalStreaming() {
    return this.isClientStreaming() && this.isServerStreaming();
  }

  usesStream() {
    return this.isClientStreaming() || this.isServerStreaming();
  }
}
