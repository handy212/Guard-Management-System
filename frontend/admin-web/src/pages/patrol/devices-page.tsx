import { useState } from "react";
import {
  DeviceIntegrationBanner,
  DeviceNetworkModal,
  DeviceSyncModal,
  formatDeviceNetworkMessage,
  formatDeviceSyncMessage,
} from "../../components/device-operations";
import { ResourceCrudPage } from "../../components/resource-crud";
import { GenericRecord } from "../../api";
import { PageContext } from "../../types/ui";

export function DevicesPage({context}: {context: PageContext}) {
  const [syncDevice, setSyncDevice] = useState<GenericRecord | null>(null);
  const [networkDevice, setNetworkDevice] = useState<GenericRecord | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  return (
    <>
      <ResourceCrudPage
        context={context}
        configKey="devices"
        panelIntro={<DeviceIntegrationBanner />}
        reloadToken={reloadToken}
        additionalRowActions={[
          {label: "Sync USB", onClick: (row) => setSyncDevice(row)},
          {label: "GPRS setup", onClick: (row) => setNetworkDevice(row)},
        ]}
      />
      {syncDevice ? (
        <DeviceSyncModal
          device={syncDevice}
          context={context}
          onClose={() => setSyncDevice(null)}
          onSuccess={(result) => {
            void context.runAction(async () => result, formatDeviceSyncMessage(result), () => {
              setReloadToken((token) => token + 1);
            });
          }}
        />
      ) : null}
      {networkDevice ? (
        <DeviceNetworkModal
          device={networkDevice}
          context={context}
          onClose={() => setNetworkDevice(null)}
          onSuccess={(result) => {
            void context.runAction(async () => result, formatDeviceNetworkMessage(result), () => {
              setReloadToken((token) => token + 1);
            });
          }}
        />
      ) : null}
    </>
  );
}
