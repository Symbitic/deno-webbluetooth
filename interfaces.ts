/** Service UUID. */
export type BluetoothServiceUUID = number | string;
/** Characteristic UUID. */
export type BluetoothCharacteristicUUID = number | string;
/** Descriptor UUID. */
export type BluetoothDescriptorUUID = number | string;

/** Manufacturer-specific data. */
export type BluetoothManufacturerDataMap = Map<number, DataView>;

/** Filter for Bluetooth scanning. */
export interface BluetoothDataFilter {
  readonly dataPrefix?: BufferSource | undefined;
  readonly mask?: BufferSource | undefined;
}

/** Filter by manufacturer. */
export interface BluetoothManufacturerDataFilter extends BluetoothDataFilter {
  companyIdentifier: number;
}

/** Filter for scanning Bluetooth devices. */
export interface BluetoothLEScanFilter {
  readonly name?: string | undefined;
  readonly namePrefix?: string | undefined;
  readonly services?: BluetoothServiceUUID[] | undefined;
  readonly manufacturerData?: BluetoothManufacturerDataFilter[] | undefined;
}

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothCharacteristicProperties BluetoothCharacteristicProperties}.
 */
export interface BluetoothCharacteristicProperties {
  readonly authenticatedSignedWrites: boolean;
  readonly broadcast: boolean;
  readonly indicate: boolean;
  readonly notify: boolean;
  readonly read: boolean;
  readonly reliableWrite: boolean;
  readonly write: boolean;
  readonly writeWithoutResponse: boolean;
}

/** Information from SimpleBLE before connecting. */
export interface RequestDeviceInfo {
  name: string;
  address: string;
  manufacturerData: BluetoothManufacturerDataMap;
}

/** Scanning options. */
export type RequestDeviceOptions = {
  filters: BluetoothLEScanFilter[];
  timeout?: number;
} | {
  filter: (info: RequestDeviceInfo) => boolean;
  timeout?: number;
};
