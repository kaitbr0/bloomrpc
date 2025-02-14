import * as React from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/ext-language_tools';
import { Resizable } from 're-resizable';
// import { storeMetadata } from "../../storage";
import { useState } from "react";
import { UpOutlined, DownOutlined } from '@ant-design/icons';

interface MetadataProps {
  onClickMetadata: () => void,
  onMetadataChange: (value: string) => void,
  value: string,
}

export function Metadata({ onClickMetadata, onMetadataChange, value }: MetadataProps) {
  const [height, setHeight] = useState(38);
  const visibile = height > 38;

  return (
    <Resizable
        size={{width: "100%", height: height}}
        maxHeight={500}
        minHeight={38}
        enable={{top:true, right:false, bottom:true, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false}}
        onResizeStop={(e, direction, ref, d) => {
          setHeight(height + d.height);
        }}
        className="meatada-panel"
         style={{
           ...styles.optionContainer,
           ...{bottom: `-38px`, height: `${height}px`},
         }}
    >
      <div>
        <div style={styles.optionLabel}>
          <a
            href={"#"}
            style={styles.optionLink}
            onClick={() => {
              if (visibile) {
                setHeight(38)
              } else {
                setHeight(150);
              }
              onClickMetadata()
            }}
          > {visibile ? <DownOutlined /> : <UpOutlined />} METADATA </a>
        </div>

        <div style={styles.metadataContainer}>
          {
          <AceEditor
            style={{ background: "#fff" }}
            width={"100%"}
            height={"100%"}
            mode="json"
            theme="textmate"
            name="metadata"
            fontSize={13}
            onChange={onMetadataChange}
            showPrintMargin={false}
            showGutter
            highlightActiveLine={false}
            value={value}
            setOptions={{
              useWorker: false,
              showLineNumbers: false,
              highlightGutterLine: false,
              fixedWidthGutter: true,
              tabSize: 1,
              displayIndentGuides: false
            }}
          />
          }
        </div>
      </div>
    </Resizable>
  )
}

const styles = {
  optionLabel: {
    background: "#001529",
    padding: "7px 10px",
    marginBottom: "5px"
  },
  optionContainer: {
    position: "absolute" as "absolute",
    fontWeight: 900,
    fontSize: "13px",
    borderLeft: "1px solid rgba(0, 21, 41, 0.18)",
    background: "#f5f5f5",
    zIndex: 10,
  },
  optionLink: {
    color: "#fff",
    textDecoration: "none",
  },
  metadataContainer: {
    padding: "10px",
    height: "100%",
    overflow: "auto"
  },
};
