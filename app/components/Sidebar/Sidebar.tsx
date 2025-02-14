import * as React from 'react';
import { useEffect, useState } from "react";
import { Button, Dropdown, Modal, Tooltip, Tree, Input } from 'antd';
import { Badge } from '../Badge/Badge';
import {OnProtoUpload, ProtoFile, ProtoService, importProtos, importProtosFromServerReflection} from '../../behaviour';
import { PathResolution } from "./PathResolution";
import { getImportPaths } from "../../storage";
import {UrlResolution} from "./UrlResolution";
import { 
  FileOutlined, 
  EyeOutlined, 
  PlusOutlined, 
  ReloadOutlined,
  FileSearchOutlined,
  FilterOutlined,
  DeleteOutlined 
} from '@ant-design/icons';


interface SidebarProps {
  protos: ProtoFile[]
  onMethodSelected: (methodName: string, protoService: ProtoService) => void
  onProtoUpload: OnProtoUpload
  onDeleteAll: () => void
  onReload: () => void
  onMethodDoubleClick: (methodName: string, protoService: ProtoService) => void
}

export function Sidebar({ protos = [], onMethodSelected, onProtoUpload, onDeleteAll, onReload, onMethodDoubleClick }: SidebarProps) {
  console.log('Sidebar rendering with protos:', {
    count: protos?.length || 0,
    files: protos?.map(p => ({
      fileName: p.fileName,
      serviceCount: Object.keys(p.services || {}).length,
      services: Object.keys(p.services || {})
    })) || []
  });

  const [importPaths, setImportPaths] = useState<string[]>([""]);
  const [importPathVisible, setImportPathsVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterMatch, setFilterMatch] = useState<string|null>(null);
  const [importReflectionVisible, setImportReflectionVisible] = useState(false);

  useEffect(() => {
    setImportPaths(getImportPaths());
  }, []);

  /**
   * An internal function to retrieve protobuff from the selected key
   * @param selected The selected key from the directory tree
   */
  function processSelectedKey(selected: string | undefined) {
    console.log('Processing key:', selected);

    // We handle only methods.
    if (!selected) {
      console.log('Selected key is undefined');
      return undefined;
    }

    if (!selected.includes("method:")) {
      console.log('Not a method selection');
      return undefined;
    }

    try {
      const fragments = selected.split('||');
      console.log('Split fragments:', fragments);

      if (fragments.length < 3) {
        console.log('Invalid key format');
        return undefined;
      }

      // Handle case where fileName is undefined
      const fileName = fragments[0] === 'undefined' ? 'user.proto' : fragments[0];
      const methodName = fragments[1].replace('method:', '');
      const serviceName = fragments[2].replace('service:', '');

      console.log('Looking for service:', { fileName, methodName, serviceName });

      const protodef = protos.find((protoFile) => {
        console.log('Checking proto file:', {
          fileName: protoFile.fileName,
          services: Object.keys(protoFile.services),
          fullName: protoFile.proto.fullName
        });
        const match = Object.keys(protoFile.services).find(
          (service) => service === serviceName
        );
        return Boolean(match);
      });

      if (!protodef) {
        console.log('No matching proto definition found');
        return undefined;
      }

      console.log('Found proto definition:', {
        fileName: protodef.fileName,
        service: protodef.services[serviceName]
      });

      return {methodName, protodef, serviceName};
    } catch (error) {
      console.error('Error processing key:', error);
      return undefined;
    }
  }

  function toggleFilter() {
    setFilterVisible(!filterVisible);
    if (filterVisible) {
      setFilterMatch(null);
    }
  }

  const importMenu = {
    items: [
      {
        key: '1',
        icon: <FileOutlined />,
        label: 'Import from file',
        onClick: () => importProtos(onProtoUpload, importPaths)
      },
      {
        key: '2',
        icon: <EyeOutlined />,
        label: 'Import from server reflection',
        onClick: () => setImportReflectionVisible(true)
      }
    ]
  };

  return (
    <>
      <div style={styles.sidebarTitleContainer}>
        <div>
          <h3 style={styles.sidebarTitle}>Protos</h3>
        </div>

        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <Dropdown.Button
            type="primary"
            onClick={() => importProtos(onProtoUpload, importPaths)}
            menu={importMenu}
          >
            <PlusOutlined />
          </Dropdown.Button>
        </div>
      </div>

      <div style={styles.optionsContainer}>
        <div style={{width: "50%"}}>
          <Tooltip title="Reload" placement="bottomLeft" align={{offset: [-8, 0]}}>
            <Button
              type="ghost"
              style={{height: 24, paddingRight: 5, paddingLeft: 5}}
              onClick={onReload}
            >
              <ReloadOutlined style={{cursor: "pointer", color: "#1d93e6"}}/>
            </Button>
          </Tooltip>

          <Tooltip title="Import Paths" placement="bottomLeft" align={{offset: [-8, 0]}}>
            <Button
                type="ghost"
                style={{height: 24, paddingRight: 5, paddingLeft: 5, marginLeft: 5}}
                onClick={() => setImportPathsVisible(true)}
            >
              <FileSearchOutlined style={{cursor: "pointer", color: "#1d93e6"}}/>
            </Button>
          </Tooltip>

          <Tooltip title="Filter method names" placement="bottomLeft" align={{offset: [-8, 0]}}>
            <Button
              type="ghost"
              style={{height: 24, paddingRight: 5, paddingLeft: 5, marginLeft: 5}}
              onClick={() => toggleFilter()}
            >
              <FilterOutlined style={{cursor: "pointer", color: "#1d93e6"}}/>
            </Button>
          </Tooltip>

          <Modal
              title={(
                  <div>
                    <FileSearchOutlined />
                    <span style={{marginLeft: 10}}> Import Paths </span>
                  </div>
              )}
              open={importPathVisible}
              onCancel={() => setImportPathsVisible(false)}
              onOk={() => setImportPathsVisible(false)}
              bodyStyle={{padding: 0}}
              width={750}
              footer={[
                <Button key="back" onClick={() => setImportPathsVisible(false)}>Close</Button>
              ]}
          >
            <PathResolution
                onImportsChange={setImportPaths}
                importPaths={importPaths}
            />
          </Modal>

          <Modal
            title={(
              <div>
                <EyeOutlined />
                <span style={{marginLeft: 10}}> Import from server reflection </span>
              </div>
            )}
            open={importReflectionVisible}
            onCancel={() => setImportReflectionVisible(false)}
            onOk={() => setImportReflectionVisible(false)}
            width={750}
            footer={[
              <Button key="back" onClick={() => setImportReflectionVisible(false)}>Close</Button>
            ]}
          >
            <UrlResolution
              onImportFromUrl={(url) => {
                importProtosFromServerReflection(onProtoUpload, url)
                setImportReflectionVisible(false)
              }}
            />
          </Modal>
        </div>
        <div style={{width: "50%", textAlign: "right"}}>
          <Tooltip title="Delete all" placement="bottomRight" align={{offset: [10, 0]}}>
            <Button type="ghost" style={{height: 24, paddingRight: 5, paddingLeft: 5}} onClick={onDeleteAll}>
              <DeleteOutlined style={{cursor: "pointer", color: "red" }} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div style={{
        overflow: "auto",
        maxHeight: "calc(100vh - 85px)",
        height: "100%"
      }}>

        <Input
          placeholder={"Filter methods"}
          hidden={!filterVisible}
          onChange={(v) => setFilterMatch(v.target.value || null)}
        />

        {protos.length > 0 && <Tree.DirectoryTree
          showIcon={false}
          defaultExpandAll
          className="proto-tree"
          style={{
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '24px'
          }}
          treeData={protos.map((proto) => ({
            key: proto.fileName,
            title: (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center',
                height: '24px',
                padding: '0 8px',
                position: 'relative',
                top: '-2px'
              }}>
                <Badge type="protoFile">P</Badge>
                <span style={{ marginLeft: '8px' }}>{proto.fileName}</span>
              </span>
            ),
            children: Object.keys(proto.services).map((service) => ({
              key: `${proto.fileName}-${service}`,
              title: (
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  height: '24px',
                  padding: '0 8px'
                }}>
                  <Badge type="service">S</Badge>
                  <span style={{ marginLeft: '8px' }}>{service}</span>
                </span>
              ),
              children: proto.services[service].methodsName
                .filter((name) => {
                  if (filterMatch === null) return true;
                  return name.toLowerCase().includes(filterMatch.toLowerCase());
                })
                .map((method) => ({
                  key: `${proto.fileName}||method:${method}||service:${service}`,
                  title: (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      height: '24px',
                      padding: '0 8px'
                    }}>
                      <Badge type="method">M</Badge>
                      <span style={{ marginLeft: '8px' }}>{method}</span>
                    </span>
                  ),
                  isLeaf: true,
                }))
            }))
          }))}
          onSelect={async (selectedKeys) => {
            console.log('Tree select triggered with:', selectedKeys);
            const selected = selectedKeys.pop()?.toString();
            console.log('Selected key:', selected);
            const protoDefinitions = processSelectedKey(selected);

            if (!protoDefinitions){
              console.log('No proto definitions found');
              return;
            }

            console.log('Method selected:', {
              methodName: protoDefinitions.methodName,
              serviceName: protoDefinitions.serviceName,
              protodef: {
                fileName: protoDefinitions.protodef.fileName,
                serviceCount: Object.keys(protoDefinitions.protodef.services).length,
                methods: protoDefinitions.protodef.services[protoDefinitions.serviceName].methodsName
              }
            });

            onMethodSelected(protoDefinitions.methodName, protoDefinitions.protodef.services[protoDefinitions.serviceName]);
          }}
          onDoubleClick={async (event, node: any) => {
            console.log("hello world");
            const selected = node.key;
            const protoDefinitions = processSelectedKey(selected);

            if (!protoDefinitions){
              return;
            }

            // if the original one table doesn't exist, then ignore it
            onMethodDoubleClick(protoDefinitions.methodName, protoDefinitions.protodef.services[protoDefinitions.serviceName])
          }}
        />}
      </div>
    </>
  );
}

const styles = {
  sidebarTitleContainer: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 4,
    paddingLeft: 20,
    paddingRight: 10,
    borderBottom: "1px solid #eee",
    background: "#001529"
  },
  sidebarTitle: {
    color: "#fff",
    marginTop: "0.5em"
  },
  icon: {
    fontSize: 23,
    marginBottom: 7,
    marginRight: 12,
    marginTop: -2,
    color: "#28d440",
    border: "2px solid #f3f6f9",
    borderRadius: "50%",
    cursor: "pointer"
  },
  optionsContainer: {
    background: "#fafafa",
    padding: "3px 6px",
    display: "flex",
    alignContent: "space-between",
    borderBottom: "1px solid #e0e0e0",
  }
};
