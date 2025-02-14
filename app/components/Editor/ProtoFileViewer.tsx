import * as React from 'react';
import AceEditor from 'react-ace';
import { Drawer } from 'antd';
import { ProtoInfo, ExtendedProto } from '../../behaviour';

interface ProtoFileViewerProps {
  protoInfo: ProtoInfo;
  visible: boolean;
  onClose: () => void;
}

export function ProtoFileViewer({ protoInfo, visible, onClose }: ProtoFileViewerProps) {
  if (!protoInfo?.service?.proto) {
    console.log('Missing required proto info:', { 
      hasProtoInfo: !!protoInfo,
      hasService: !!protoInfo?.service,
      hasProto: !!protoInfo?.service?.proto 
    });
    return null;
  }

  const proto = protoInfo.service.proto as ExtendedProto;
  const fileName = proto.filename || 'Proto File';
  const protoText = proto.protoText || '';

  return (
    <Drawer
      title={fileName}
      placement={"right"}
      width={"50%"}
      closable={false}
      onClose={onClose}
      visible={visible}
    >
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
        setOptions={{
          useWorker: true,
          displayIndentGuides: false,
          showLineNumbers: false,
          highlightGutterLine: false,
          fixedWidthGutter: true,
          tabSize: 1,
        }}
      />
    </Drawer>
  );
}
