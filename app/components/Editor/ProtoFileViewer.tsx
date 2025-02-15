import * as React from 'react';
import { Drawer } from 'antd';
import { ProtoInfo } from '../../behaviour';

// Import ace editor and required extensions
import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-noconflict/mode-protobuf';
import 'ace-builds/src-noconflict/theme-textmate';

interface ProtoFileViewerProps {
  protoInfo: ProtoInfo;
  visible: boolean;
  onClose: () => void;
}

// TODO: Add proper protobuf worker for syntax highlighting and validation 
// once the app is more stable. For now, disable workers to avoid errors.
const editorOptions = {
  useWorker: false,
  displayIndentGuides: false,
  showLineNumbers: false,
  highlightGutterLine: false,
  fixedWidthGutter: true,
  tabSize: 1,
};

export function ProtoFileViewer({ protoInfo, visible, onClose }: ProtoFileViewerProps) {
  if (!protoInfo?.service?.proto) {
    console.log('Missing required proto info:', { 
      hasProtoInfo: !!protoInfo,
      hasService: !!protoInfo?.service,
      hasProto: !!protoInfo?.service?.proto 
    });
    return null;
  }

  const proto = protoInfo.service.proto;
  const fileName = proto.fileName || 'Proto File';
  const protoText = proto.protoText || '';

  return (
    <Drawer
      title={fileName}
      placement={"right"}
      width={"50%"}
      closable={false}
      onClose={onClose}
      open={visible}
    >
      {
      <AceEditor
        style={{ marginTop: "10px", background: "#fff" }}
        width={"100%"}
        height={"calc(100vh - 115px)"}
        mode="protobuf"
        theme="textmate"
        name="output"
        fontSize={13}
        showPrintMargin={false}
        wrapEnabled
        showGutter={false}
        readOnly
        highlightActiveLine={false}
        value={protoText}
        onLoad={(editor: any) => {
          editor.renderer.$cursorLayer.element.style.display = "none";
          editor.gotoLine(0, 0, true);
        }}
        setOptions={editorOptions}
      />
      }
    </Drawer>
  );
}
