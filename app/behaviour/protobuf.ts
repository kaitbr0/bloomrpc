import * as protobuf from 'protobufjs';

export type Proto = protobuf.Root;

export interface ServiceMethodsPayload {
  [key: string]: () => {
    plain: any;
  };
}

export interface ProtoFile {
  proto: Proto;
  fileName: string;
  services: ProtoServiceList;
}

export interface ProtoServiceList {
  [key: string]: ProtoService;
}

export interface ProtoService {
  proto: Proto;
  serviceName: string;
  methodsMocks: ServiceMethodsPayload;
  methodsName: string[];
}
