import * as React from 'react';
import { useEffect, useReducer } from 'react';
import {
  actions,
  setData, setEnvironment, setInteractive,
  setMetadata,
  setMetadataVisibilty,
  setProtoVisibility,
  setTSLCertificate,
  setUrl,
} from './actions';
import { Response } from './Response';
import { Metadata } from './Metadata';
import { Controls, isControlVisible } from './Controls';
import { Request } from './Request';
import { Options } from './Options';
import { ProtoFileViewer } from './ProtoFileViewer';
import { Certificate, ProtoInfo, GRPCEventEmitter } from '../../behaviour';
import { getMetadata, getUrl, storeUrl } from '../../storage';

import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-protobuf';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/ext-language_tools';
import { exportResponseToJSONFile } from "../../behaviour/response";
import { Resizable } from 're-resizable';
import { AddressBar } from "./AddressBar";
import { deleteEnvironment, getEnvironments, saveEnvironment } from "../../storage/environments";

export interface EditorAction {
  [key: string]: any
  type: string
}

export interface EditorEnvironment {
  name: string
  url: string
  metadata: string,
  interactive: boolean
  tlsCertificate: Certificate,
}

export interface EditorRequest {
  url: string
  data: string
  inputs?: string // @deprecated
  metadata: string
  interactive: boolean
  environment?: string
  grpcWeb: boolean
  tlsCertificate?: Certificate
}

export interface EditorState extends EditorRequest {
  loading: boolean
  response: EditorResponse
  metadataOpened: boolean
  protoViewVisible: boolean
  requestStreamData: string[]
  responseStreamData: EditorResponse[]
  streamCommitted: boolean
  call?: GRPCEventEmitter
}

export interface EditorProps {
  protoInfo?: ProtoInfo
  onRequestChange?: (editorRequest: EditorRequest & EditorState) => void
  initialRequest?: EditorRequest
  environmentList?: EditorEnvironment[]
  onEnvironmentListChange?: (environmentList: EditorEnvironment[]) => void
  active?: boolean
}

export interface EditorResponse {
  output: string;
  responseTime?: number;
}

const INITIAL_STATE: EditorState = {
  url: "0.0.0.0:3009",
  data: "",
  metadata: "",
  requestStreamData: [],
  responseStreamData: [],
  interactive: false,
  grpcWeb: false,
  loading: false,
  response: {
    output: "",
    responseTime: undefined,
  },
  metadataOpened: false,
  protoViewVisible: false,
  streamCommitted: false,
  tlsCertificate: undefined,
  call: undefined,
};

/**
 * Reducer
 * @param state
 * @param action
 */
const reducer = (state: EditorState, action: EditorAction) => {
  switch (action.type) {

    case actions.SET_DATA:
      return { ...state, data: action.data };

    case actions.SET_URL:
      return { ...state, url: action.value };

    case actions.SET_IS_LOADING:
      return { ...state, loading: action.isLoading };

    case actions.SET_RESPONSE:
      return { ...state, response: action.response };

    case actions.SET_CALL:
      return { ...state, call: action.call };

    case actions.SET_METADATA_VISIBILITY:
      return { ...state, metadataOpened: action.visible };

    case actions.SET_METADATA:
      return { ...state, metadata: action.metadata };

    case actions.SET_PROTO_VISIBILITY:
      return { ...state, protoViewVisible: action.visible };

    case actions.SET_INTERACTIVE:
      return { ...state, interactive: action.interactive };

    case actions.SET_GRPC_WEB:
      return { ...state, grpcWeb: action.grpcWeb };

    case actions.SET_REQUEST_STREAM_DATA:
      return { ...state, requestStreamData: action.requestData };

    case actions.SET_RESPONSE_STREAM_DATA:
      return { ...state, responseStreamData: action.responseData };

    case actions.ADD_RESPONSE_STREAM_DATA:
      return { ...state, responseStreamData: [...state.responseStreamData, action.responseData] };

    case actions.SET_STREAM_COMMITTED:
      return { ...state, streamCommitted: action.committed };

    case actions.SET_SSL_CERTIFICATE:
      return { ...state, tlsCertificate: action.certificate };

    case actions.SET_ENVIRONMENT:
      return { ...state, environment: action.environment };

    default:
      return state
  }
};

export function Editor({ protoInfo, initialRequest, onRequestChange, onEnvironmentListChange, environmentList, active }: EditorProps) {

  const [state, dispatch] = useReducer(reducer, {
    ...INITIAL_STATE,
    url: (initialRequest && initialRequest.url) || getUrl() || INITIAL_STATE.url,
    interactive: initialRequest ? initialRequest.interactive : (protoInfo && protoInfo.usesStream()) || INITIAL_STATE.interactive,
    grpcWeb: initialRequest ? initialRequest.grpcWeb : INITIAL_STATE.grpcWeb,
    metadata: (initialRequest && initialRequest.metadata) || getMetadata() || INITIAL_STATE.metadata,
    environment: (initialRequest && initialRequest.environment),
  }, undefined);

  useEffect(() => {
    if (protoInfo && !initialRequest) {
      try {
        // Get the method definition first
        const methodDef = protoInfo.methodDef();

        // Look up the request type using the correct type name
        const requestType = protoInfo.service.proto.lookupType(methodDef.requestType);

        // Generate mock data based on field types
        function generateMockData(type: any): Record<string, any> {
          const mockData: Record<string, any> = {};
          
          Object.entries(type.fields).forEach(([fieldName, field]: [string, any]) => {
            // Handle nested messages
            if (field.resolvedType) {
              mockData[fieldName] = generateMockData(field.resolvedType);
              return;
            }

            // Handle basic types
            switch (field.type) {
              case 'string':
                mockData[fieldName] = `Sample ${fieldName}`;
                break;
              case 'number':
              case 'int32':
              case 'int64':
              case 'uint32':
              case 'uint64':
              case 'sint32':
              case 'sint64':
              case 'fixed32':
              case 'fixed64':
              case 'double':
              case 'float':
                mockData[fieldName] = 0;
                break;
              case 'bool':
                mockData[fieldName] = false;
                break;
              case 'bytes':
                mockData[fieldName] = "";
                break;
              default:
                mockData[fieldName] = null;
            }
          });

          return mockData;
        }

        const requestStructure = generateMockData(requestType);
        dispatch(setData(JSON.stringify(requestStructure, null, 2)));
      } catch (e) {
        console.error('Error creating request structure:', e);
        dispatch(setData(JSON.stringify({
          "error": `Could not determine request structure: ${e.message}`
        }, null, 2)));
      }
    }

    if (initialRequest) {
      dispatch(setData(initialRequest.inputs || initialRequest.data));
      dispatch(setMetadata(initialRequest.metadata));
      dispatch(setTSLCertificate(initialRequest.tlsCertificate));
    }
  }, []);

  return (
    <div style={styles.tabContainer}>
      <div style={styles.inputContainer}>
        <div style={{ width: "60%" }}>
          <AddressBar
              protoInfo={protoInfo}
              loading={state.loading}
              url={state.url}
              defaultEnvironment={state.environment}
              environments={environmentList}
              onChangeEnvironment={(environment) => {

                if (!environment) {
                  dispatch(setEnvironment(""));
                  onRequestChange && onRequestChange({
                    ...state,
                    environment: "",
                  });
                  return;
                }

                dispatch(setUrl(environment.url));
                dispatch(setMetadata(environment.metadata));
                dispatch(setEnvironment(environment.name));
                dispatch(setTSLCertificate(environment.tlsCertificate));
                dispatch(setInteractive(environment.interactive));

                onRequestChange && onRequestChange({
                  ...state,
                  environment: environment.name,
                  url: environment.url,
                  metadata: environment.metadata,
                  tlsCertificate: environment.tlsCertificate,
                  interactive: environment.interactive,
                });
              }}
              onEnvironmentDelete={(environmentName) => {
                deleteEnvironment(environmentName);
                dispatch(setEnvironment(""));
                onRequestChange && onRequestChange({
                  ...state,
                  environment: "",
                });
                onEnvironmentListChange && onEnvironmentListChange(
                    getEnvironments()
                );
              }}
              onEnvironmentSave={(environmentName) => {
                saveEnvironment({
                  name: environmentName,
                  url: state.url,
                  interactive: state.interactive,
                  metadata: state.metadata,
                  tlsCertificate: state.tlsCertificate,
                });

                dispatch(setEnvironment(environmentName));
                onRequestChange && onRequestChange({
                  ...state,
                  environment: environmentName,
                });

                onEnvironmentListChange && onEnvironmentListChange(
                    getEnvironments()
                );
              }}
              onChangeUrl={(e) => {
                dispatch(setUrl(e.target.value));
                storeUrl(e.target.value);
                onRequestChange && onRequestChange({
                  ...state,
                  url: e.target.value,
                });
              }}
          />
        </div>

        {protoInfo && (
          <Options
            protoInfo={protoInfo}
            dispatch={dispatch}
            grpcWebChecked={state.grpcWeb}
            interactiveChecked={state.interactive}
            onClickExport={async () => {
              await exportResponseToJSONFile(protoInfo, state)
            }}
            onInteractiveChange={(checked) => {
              onRequestChange && onRequestChange({
                ...state,
                interactive: checked,
              });
            }}
            tlsSelected={state.tlsCertificate}
            onTLSSelected={(certificate) => {
              dispatch(setTSLCertificate(certificate));
              onRequestChange && onRequestChange({
                ...state,
                tlsCertificate: certificate,
              });
            }}
          />
        )}
      </div>

      <div style={styles.editorContainer}>
        <Resizable
            enable={{ right: true }}
            defaultSize={{
              width: "50%",
            }}
            maxWidth={"80%"}
            minWidth={"10%"}
        >
          <Request
            data={state.data}
            streamData={state.requestStreamData}
            active={active}
            onChangeData={(value) => {
              dispatch(setData(value));
              onRequestChange && onRequestChange({
                ...state,
                data: value,
              });
            }}
          />

          <div style={{
            ...styles.playIconContainer,
            ...(isControlVisible(state) ? styles.streamControlsContainer : {}),
          }}>
            <Controls
                active={active}
                dispatch={dispatch}
                state={state}
                protoInfo={protoInfo}
            />
          </div>
        </Resizable>

        <div style={{...styles.responseContainer}}>
          <Response
            streamResponse={state.responseStreamData}
            response={state.response}
          />
        </div>
      </div>

      <Metadata
        onClickMetadata={() => {
          dispatch(setMetadataVisibilty(!state.metadataOpened));
        }}
        onMetadataChange={(value) => {
          dispatch(setMetadata(value));
          onRequestChange && onRequestChange({
            ...state,
            metadata: value,
          });
        }}
        value={state.metadata}
      />

      {protoInfo && (
        <ProtoFileViewer
          protoInfo={protoInfo}
          visible={state.protoViewVisible}
          onClose={() => dispatch(setProtoVisibility(false))}
        />
      )}
    </div>
  )
}

const styles = {
  tabContainer: {
    width: "100%",
    height: "100%",
    position: "relative" as "relative",
  },
  editorContainer: {
    display: "flex",
    height: "100%",
    borderLeft: "1px solid rgba(0, 21, 41, 0.18)",
    background: "#fff"
  },
  responseContainer: {
    background: "white",
    maxWidth: "inherit",
    width: "inherit",
    display: "flex",
    flex: "1 1 0%",
    borderLeft: "1px solid #eee",
    borderRight: "1px solid rgba(0, 21, 41, 0.18)",
    overflow: "auto"
  },
  playIconContainer: {
    position: "absolute" as "absolute",
    zIndex: 10,
    right: "-30px",
    marginLeft: "-25px",
    top: "calc(50% - 80px)",
  },
  streamControlsContainer: {
    right: "-42px",
  },
  inputContainer: {
    display: "flex",
    justifyContent: "space-between",
    border: "1px solid rgba(0, 21, 41, 0.18)",
    borderBottom: "1px solid #eee",
    background: "#fafafa",
    padding: "15px",
    boxShadow: "2px 0px 4px 0px rgba(0,0,0,0.20)",
  },
};
