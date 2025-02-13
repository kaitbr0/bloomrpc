import * as React from 'react';
import { Input, Modal, Select } from "antd";
import { DeleteOutlined, EditOutlined, LoadingOutlined, DatabaseOutlined, ProjectOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { RequestType } from "./RequestType";
import { ChangeEvent, useEffect, useState } from "react";
import { ProtoInfo } from "../../behaviour";
import { EditorEnvironment } from "./Editor";

export interface AddressBarProps {
  loading: boolean
  url: string
  environments?: EditorEnvironment[]
  protoInfo?: ProtoInfo
  onChangeUrl?: (e: ChangeEvent<HTMLInputElement>) => void
  defaultEnvironment?: string
  onChangeEnvironment?: (environment?: EditorEnvironment) => void
  onEnvironmentSave?: (name: string) => void
  onEnvironmentDelete?: (name: string) => void
}

export function AddressBar({loading, url, onChangeUrl, protoInfo, defaultEnvironment, environments, onEnvironmentSave, onChangeEnvironment, onEnvironmentDelete}: AddressBarProps) {
  const [currentEnvironmentName, setCurrentEnvironmentName] = useState<string>(defaultEnvironment || "");
  const [newEnvironmentName, setNewEnvironmentName] = useState<string>("");

  const [confirmedSave, setConfirmedSave] = useState(false);
  const [confirmedDelete, setConfirmedDelete] = useState(false);

  useEffect(() => {
    if (confirmedSave) {
      if (newEnvironmentName) {
        setCurrentEnvironmentName(newEnvironmentName);
        onEnvironmentSave && onEnvironmentSave(newEnvironmentName);
      } else {
        setCurrentEnvironmentName(currentEnvironmentName);
        onEnvironmentSave && onEnvironmentSave(currentEnvironmentName);
      }

      setConfirmedSave(false);
      setNewEnvironmentName("");
    }
  }, [confirmedSave]);

  useEffect(() => {
    if (confirmedDelete) {
      onEnvironmentDelete && onEnvironmentDelete(currentEnvironmentName)

      setConfirmedDelete(false);
      setCurrentEnvironmentName("");
    }
  }, [confirmedDelete]);

  return (
    <div style={{ display: 'flex', padding: '8px', alignItems: 'center', gap: '8px' }}>
      <Select
        defaultValue={currentEnvironmentName}
        value={currentEnvironmentName || undefined}
        placeholder={"Env"}
        style={{ width: 120 }}
        dropdownStyle={{ minWidth: 200 }}
        onSelect={(value: string) => {
          // Save brand new environment
          if (value === "new") {
            Modal.confirm({
              title: 'Environment Name',
              className: "env-modal",
              icon: (
                  <ProjectOutlined />
              ),
              onOk: () => {
                setConfirmedSave(true);
              },
              content: (
                  <Input autoFocus={true} required placeholder={"Staging"} onChange={(e) => {
                    setNewEnvironmentName(e.target.value);
                  }} />
              ),

              okText: 'Confirm',
              cancelText: 'Cancel',
            });
            return;
          }

          if (value === "update") {
            Modal.confirm({
              title: `Update ${currentEnvironmentName}?`,
              className: "env-modal",
              icon: (
                  <ProjectOutlined />
              ),
              onOk: () => {
                setConfirmedSave(true);
              },
              content: `Do you want to update the environment?`,
              okText: 'Confirm',
              cancelText: 'Cancel',
            });
            return;
          }

          if (value === "delete") {
            Modal.confirm({
              title: `Deleting ${currentEnvironmentName}?`,
              className: "env-modal",
              icon: (
                  <DeleteOutlined />
              ),
              onOk: () => {
                setConfirmedDelete(true);
              },
              content: `Are you sure do you want to delete the environment?`,
              okText: 'Confirm',
              cancelText: 'Cancel',
            });
            return;
          }

          setCurrentEnvironmentName(value);

          const selectedEnv = (environments || []).find(env => env.name === value);
          onChangeEnvironment && onChangeEnvironment(selectedEnv);
        }}
      >
        <Select.Option value="">
          None
        </Select.Option>

        {environments && environments.map(environment => (
          <Select.Option key={environment.name} value={environment.name}>{environment.name}</Select.Option>
        ))}

        {currentEnvironmentName &&
          <Select.Option value="update">
              <EditOutlined /> Update Environment
          </Select.Option>
        }
        {currentEnvironmentName &&
        <Select.Option value="delete">
            <DeleteOutlined /> Delete Environment
        </Select.Option>
        }
        <Select.Option value="new">
          <PlusCircleOutlined /> Save New Environment
        </Select.Option>
      </Select>

      <Input
        style={{ flex: 1 }}
        className="server-url"
        value={url}
        onChange={onChangeUrl}
      />

      <div className="server-address" style={{ 
        backgroundColor: '#001529', 
        color: 'white',
        padding: '4px 15px',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <DatabaseOutlined />
        <span>Server Address</span>
      </div>
    </div>
  )
}
