import { Root, Message } from 'protobufjs';

export interface Proto extends Root {
  fileName?: string;
  filePath?: string;
  protoText?: string;
  ast?: any;
  nested?: {[k: string]: any};
}

export interface MethodPayload {
  plain: {[key: string]: any};
  message: Message;
}

export type ServiceMethodsPayload = {
  [name: string]: () => MethodPayload
};

export interface ProtoFile {
  proto: Proto,
  fileName: string
  services: ProtoServiceList;
}

export interface ProtoServiceList {
  [key: string]: ProtoService,
}

export interface ProtoService {
  proto: Proto,
  serviceName: string,
  methodsMocks: ServiceMethodsPayload,
  methodsName: string[],
}
