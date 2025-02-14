// @ts-ignore
import * as lodashGet from 'lodash.get';
import { ProtoService, Proto } from './protobuf';

// Extend Proto type with our needed properties
export interface ExtendedProto extends Proto {
  filename: string | null;
  protoText: string | null;
  ast: any | null;
}

export class ProtoInfo {
  service: ProtoService;
  methodName: string;

  constructor(service: ProtoService, methodName: string) {
    this.service = service;
    this.methodName = methodName;
  }

  client(): any {
    return lodashGet((this.service.proto as ExtendedProto).ast, this.service.serviceName);
  }

  serviceDef() {
    return this.service.proto.lookupService(this.service.serviceName);
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
