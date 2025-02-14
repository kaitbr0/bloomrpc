import * as React from 'react';
import AceEditor, { ICommand } from 'react-ace';
import * as Mousetrap from 'mousetrap'
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/ext-language_tools';
import { Tabs } from 'antd';
import { Viewer } from './Viewer';

interface RequestProps {
  data: string
  streamData: string[]
  onChangeData: (value: string) => void
  commands?: ICommand[]
  active?: boolean
}

export function Request({onChangeData, commands, data, streamData, active}: RequestProps) {
  const editorTabKey = `editorTab`;

  // bind esc for focus on the active editor window
  const aceEditor = React.useRef<AceEditor>(null)
  React.useEffect(() => {
    if (active) {
      Mousetrap.bindGlobal('esc', () => {
        const node = aceEditor.current as any
        if (node && 'editor' in node) {
          node.editor.focus()
        }
      })
    }
  })

  // Add the same editor options to disable workers
  const editorOptions = {
    useWorker: false,
    displayIndentGuides: true
  };

  const tabItems = [
    {
      key: editorTabKey,
      label: "Editor",
      children: (
        <AceEditor
          ref={aceEditor}
          style={{ background: "#fff" }}
          width={"100%"}
          height={"calc(100vh - 185px)"}
          mode="json"
          theme="textmate"
          name="inputs"
          fontSize={13}
          cursorStart={2}
          onChange={onChangeData}
          commands={commands}
          showPrintMargin={false}
          showGutter
          highlightActiveLine={false}
          value={data}
          setOptions={editorOptions}
          tabSize={2}
        />
      )
    },
    ...streamData.map((data, key) => ({
      key: `${key}`,
      label: `Stream ${key + 1}`,
      children: <Viewer output={data} />
    }))
  ];

  return (
    <>
      <Tabs
        defaultActiveKey={editorTabKey}
        tabPosition={"top"}
        style={{width: "100%"}}
        items={tabItems}
      />
    </>
  )
}
