import * as React from 'react';
import { useEffect, useState } from 'react';
import { Layout, notification } from 'antd';
import { Sidebar } from './Sidebar';
import { TabData, TabList } from './TabList';
import {loadProtos, ProtoFile, ProtoService} from '../behaviour';
import {
  EditorTabsStorage,
  deleteRequestInfo,
  getImportPaths,
  getProtos,
  getRequestInfo,
  getTabs,
  storeProtos,
  storeRequestInfo,
  storeTabs,
} from '../storage';
import { EditorEnvironment } from "./Editor";
import { getEnvironments } from "../storage/environments";
import { v4 as uuidv4 } from 'uuid';

export interface EditorTabs {
  activeKey: string
  tabs: TabData[]
}

// Add local implementation
const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
};

export function BloomRPC() {
  const [protos, setProtos] = useState<ProtoFile[]>([]);
  const [editorTabs, setEditorTabs] = useState<EditorTabs>({
    activeKey: "0",
    tabs: [],
  });
  const [environments, setEnvironments] = useState<EditorEnvironment[]>(getEnvironments());

  function setTabs(props: EditorTabs) {
    setEditorTabs(props);
    storeTabs(props);
  }

  function updateProtos(props: ProtoFile[]) {
    setProtos(props);
    storeProtos(props);
  }

  // Preload editor with stored data.
  useEffect(() => {
    hydrateEditor(setProtos, setTabs);
  }, []);

  console.log('BloomRPC about to return JSX');
  return (
    <Layout style={styles.layout}>
      <Layout.Sider style={styles.sider} width={300}>
        <Sidebar
          protos={protos}
          onProtoUpload={handleProtoUpload(setProtos, protos)}
          onReload={() => {
            console.log('Sidebar reload clicked');
            hydrateEditor(setProtos, setEditorTabs);
          }}
          onMethodSelected={handleMethodSelected(editorTabs, setTabs)}
          onDeleteAll={() => {
            setProtos([]);
          }}
          onMethodDoubleClick={handleMethodDoubleClick(editorTabs, setTabs)}
        />
      </Layout.Sider>

      <Layout style={{ width: 'calc(100% - 300px)' }}>
        <Layout.Content style={styles.content}>
          <TabList
            tabs={editorTabs.tabs || []}
            onDragEnd={({oldIndex, newIndex}) => {
              const newTab = editorTabs.tabs[oldIndex];

              setTabs({
                activeKey: newTab && newTab.tabKey || editorTabs.activeKey,
                tabs: arrayMove(
                    editorTabs.tabs,
                    oldIndex,
                    newIndex,
                ).filter(e => e),
              })
            }}
            activeKey={editorTabs.activeKey}
            environmentList={environments}
            onEnvironmentChange={() => {
              setEnvironments(getEnvironments());
            }}
            onEditorRequestChange={(editorRequestInfo) => {
              storeRequestInfo(editorRequestInfo);
            }}
            onDelete={(activeKey: string) => {
              let newActiveKey = "0";

              const index = editorTabs.tabs
                .findIndex(tab => tab.tabKey === activeKey);

              if (index === -1) {
                return;
              }

              if (editorTabs.tabs.length > 1) {
                if (activeKey === editorTabs.activeKey) {
                  const newTab = editorTabs.tabs[index - 1] || editorTabs.tabs[index + 1];
                  newActiveKey = newTab.tabKey;
                } else {
                  newActiveKey = editorTabs.activeKey;
                }
              }

              deleteRequestInfo(activeKey);

              setTabs({
                activeKey: newActiveKey,
                tabs: editorTabs.tabs.filter(tab => tab.tabKey !== activeKey),
              });

            }}
            onChange={(activeKey: string) => {
              setTabs({
                activeKey,
                tabs: editorTabs.tabs || [],
              })
            }}
          />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

/**
 * Hydrate editor from persisted storage
 * @param setProtos
 * @param setEditorTabs
 */
async function hydrateEditor(setProtos: React.Dispatch<ProtoFile[]>, setEditorTabs: React.Dispatch<EditorTabs>) {
  try {
    console.log('Starting hydration...');
    const hydration = [];
    const savedProtos = getProtos();
    console.log('Saved protos for hydration:', savedProtos);

    if (savedProtos) {
      // Don't reload protos from disk, just use the stored ones
      setProtos(savedProtos);
      console.log('Set protos from storage:', savedProtos);

      const savedEditorTabs = getTabs();
      console.log('Saved editor tabs:', savedEditorTabs);
      
      if (savedEditorTabs) {
        hydration.push(
          loadTabs(savedEditorTabs)
            .catch(err => {
              console.error('Error loading tabs:', err);
              setEditorTabs({activeKey: "0", tabs: []});
              return false;
            })
            .then(setEditorTabs)
            .then(() => true)
        );
      }
    }

    return Promise.all(hydration);
  } catch (err) {
    console.error('Hydration error:', err);
    return [];
  }
}

/**
 * Load tabs
 * @param editorTabs
 */
async function loadTabs(editorTabs: EditorTabsStorage): Promise<EditorTabs> {
  console.log('Loading tabs with:', editorTabs);
  
  const storedEditTabs: EditorTabs = {
    activeKey: editorTabs.activeKey,
    tabs: [],
  };

  const importPaths = getImportPaths();

  const protoPaths = editorTabs.tabs.map((tab) => {
    return tab.protoPath;
  });

  const protos = await loadProtos(protoPaths, importPaths);

  const previousTabs = editorTabs.tabs.map((tab) => {
    const def = protos.find((protoFile) => {
      const match = Object.keys(protoFile.services).find((service) => service === tab.serviceName);
      return Boolean(match);
    });

    if (!def) {
      console.log('No definition found for tab:', tab);
      return false;
    }

    return {
      tabKey: tab.tabKey,
      methodName: tab.methodName,
      service: def.services[tab.serviceName],
      initialRequest: getRequestInfo(tab.tabKey),
    }
  });

  storedEditTabs.tabs = previousTabs.filter((tab) => tab) as TabData[];
  // TODO: fix storage, figure it out
  console.log('Final stored tabs:', storedEditTabs);

  return storedEditTabs;
}

/**
 *
 * @param setProtos
 * @param protos
 */
function handleProtoUpload(setProtos: React.Dispatch<ProtoFile[]>, protos: ProtoFile[]) {
  return function (newProtos: ProtoFile[], err: Error | void) {
    console.log('Proto upload callback:', { 
      newProtos: newProtos.map(p => ({
        fileName: p.fileName,
        serviceCount: Object.keys(p.services || {}).length,
        services: Object.keys(p.services || {})
      }))
    });
    if (err) {
      console.error('Proto upload error:', err);
      notification.error({
        message: "Error while importing protos",
        description: err.message,
        duration: 5,
        placement: "bottomLeft",
        style: {
          width: "89%",
          wordBreak: "break-all",
        }
      });
      setProtos([]);
      return;
    }

    const protoMinusExisting = protos.filter((proto) => {
      return !newProtos.find((p) => p.fileName === proto.fileName)
    });

    const appProtos = [...protoMinusExisting, ...newProtos];
    console.log('Setting protos state:', appProtos);
    setProtos(appProtos);
    console.log('Storing protos:', appProtos);
    storeProtos(appProtos);

    return appProtos;
  }
}

/**
 * Handle method selected
 * @param editorTabs
 * @param setTabs
 */
function handleMethodSelected(editorTabs: EditorTabs, setTabs: React.Dispatch<EditorTabs>) {
  return (methodName: string, protoService: ProtoService) => {
    console.log('Handling method selection:', { methodName, protoService });
    const tab = {
      tabKey: `${protoService.serviceName}${methodName}`,
      methodName,
      service: protoService
    };

    const tabExists = editorTabs.tabs
      .find(exisingTab => exisingTab.tabKey === tab.tabKey);

    if (tabExists) {
      setTabs({
        activeKey: tab.tabKey,
        tabs: editorTabs.tabs,
      });
      return;
    }

    const newTabs = [...editorTabs.tabs, tab];

    setTabs({
      activeKey: tab.tabKey,
      tabs: newTabs,
    });
  }
}

function handleMethodDoubleClick(editorTabs: EditorTabs, setTabs: React.Dispatch<EditorTabs>){
  return (methodName: string, protoService: ProtoService) => {
    const tab = {
      tabKey: `${protoService.serviceName}${methodName}-${uuidv4()}`,
      methodName,
      service: protoService
    };

    const newTabs = [...editorTabs.tabs, tab];

    setTabs({
      activeKey: tab.tabKey,
      tabs: newTabs,
    });
  }

}

const styles = {
  layout: {
    height: "100vh",
    width: "100vw",
    display: "flex",
  },
  sider: {
    zIndex: 1,
    width: 300,
    minWidth: 300,
    maxWidth: 300,
    borderRight: "1px solid rgba(0, 21, 41, 0.18)",
    backgroundColor: "white",
    boxShadow: "3px 0px 4px 0px rgba(0,0,0,0.10)",
    overflow: "auto"
  },
  content: {
    flex: 1,
    overflow: "auto",
    width: '100%'
  }
};
