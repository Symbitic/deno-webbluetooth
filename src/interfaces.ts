/** 128-bit UUID string. */
export type UUID = string;

/** Manufacturer data. */
export type BluetoothManufacturerDataMap = Map<number, DataView>;

/**
 * Bluetooth advertisement data.
 */
export interface BluetoothAdvertisement {
  rssi: number;
  manufacturerData: BluetoothManufacturerDataMap;
}

/**
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/BluetoothCharacteristicProperties
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

/**
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTDescriptor
 *     + https://github.com/thegecko/webbluetooth/blob/master/src/descriptor.ts
 *     + https://github.com/IjzerenHein/node-web-bluetooth/blob/master/src/BluetoothRemoteGATTDescriptor.js
 */
export interface IBluetoothRemoteGATTDescriptor {
  readonly uuid: string;
  readonly characteristic: IBluetoothRemoteGATTCharacteristic;
  readonly value: ArrayBuffer;
  readValue(): Promise<ArrayBuffer>;
  writeValue(array: ArrayBuffer): Promise<void>;
}

/**
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic
 *     + https://github.com/IjzerenHein/node-web-bluetooth/blob/master/src/BluetoothRemoteGATTCharacteristic.js
 */
export interface IBluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly uuid: string;
  readonly service: IBluetoothRemoteGATTService;
  readonly properties: BluetoothCharacteristicProperties;
  readonly value?: DataView;
  oncharacteristicvaluechanged: ((this: this, ev: Event) => any) | null;
  addEventListener(
    type: "characteristicvaluechanged",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  // getDescriptor(uuid: UUID): Promise<IBluetoothRemoteGATTDescriptor>;
  // getDescriptors(uuid?: UUID): Promise<IBluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValueWithResponse(value: ArrayBuffer): Promise<void>;
  writeValueWithoutResponse(value: ArrayBuffer): Promise<void>;
  startNotifications(): Promise<this>;
  stopNotifications(): Promise<void>;
}

/**
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService
 *     + https://github.com/IjzerenHein/node-web-bluetooth/blob/master/src/BluetoothRemoteGATTService.js
 */
export interface IBluetoothRemoteGATTService extends EventTarget {
  readonly uuid: string;
  readonly device: IBluetoothDevice;
  readonly isPrimary: boolean;
  getCharacteristic(uuid: string): Promise<IBluetoothRemoteGATTCharacteristic>;
  getCharacteristics(
    uuid?: string,
  ): Promise<IBluetoothRemoteGATTCharacteristic[]>;
  addEventListener(
    type: "serviceadded",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: "servicechanged",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: "serviceremoved",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
}

/**
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer
 */
export interface IBluetoothRemoteGATTServer {
  readonly connected: boolean;
  readonly device: IBluetoothDevice;
  connect(): Promise<IBluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<IBluetoothRemoteGATTService>;
  getPrimaryServices(uuid?: string): Promise<IBluetoothRemoteGATTService[]>;
}

/**
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/BluetoothDevice
 */
export interface IBluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name: string;
  readonly gatt: IBluetoothRemoteGATTServer;
  readonly advertisement: BluetoothAdvertisement;
  addEventListener(
    type: "advertisementreceived",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: "serviceadded",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: "servicechanged",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
  addEventListener(
    type: "serviceremoved",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
}

/**
 * Information from SimpleBLE before connecting.
 */
export interface RequestDeviceInfo {
  id: string;
  address: string;
  manufacturerData: BluetoothManufacturerDataMap;
}

/**
 * https://webbluetoothcg.github.io/web-bluetooth/#device-discovery
 */
export interface RequestDeviceOptions {
  /** Select which device to return */
  deviceFound: (device: RequestDeviceInfo) => boolean;
  /** Scanning timeout (5 seconds by default) */
  timeout?: number;
}

/**
 * The Bluetooth interface.
 *
 * @TODO ValueEvent for "availabilitychanged"
 *
 * See also:
 *     + https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth
 *     + https://github.com/thegecko/webbluetooth/blob/master/src/bluetooth.ts
 */
export interface IBluetooth extends EventTarget {
  getAvailability(): Promise<boolean>;
  getDevices(): Promise<IBluetoothDevice[]>;
  requestDevice(options: RequestDeviceOptions): Promise<IBluetoothDevice>;
  readonly referringDevice?: IBluetoothDevice;
  onavailabilitychanged: ((this: IBluetooth, ev: Event) => any) | null;
  addEventListener(
    type: "availabilitychanged",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
}
