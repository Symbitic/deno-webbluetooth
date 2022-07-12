/** 128-bit UUID string. */
export type UUID = string;

/** Bluetooth manufacturer data. */
export type BluetoothManufacturerDataMap = Map<number, DataView>;

/** Bluetooth advertisement data. */
export interface BluetoothAdvertisement {
  rssi: number;
  manufacturerData: BluetoothManufacturerDataMap;
}

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothCharacteristicProperties BluetoothCharacteristicProperties} interface.
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
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTDescriptor BluetoothRemoteGATTDescriptor} interface.
 */
export interface IBluetoothRemoteGATTDescriptor {
  readonly uuid: string;
  readonly characteristic: IBluetoothRemoteGATTCharacteristic;
  readonly value: ArrayBuffer;
  readValue(): Promise<ArrayBuffer>;
  writeValue(array: ArrayBuffer): Promise<void>;
}

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic BluetoothRemoteGATTCharacteristic} interface.
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
  getDescriptor(uuid: UUID): Promise<IBluetoothRemoteGATTDescriptor>;
  getDescriptors(uuid?: UUID): Promise<IBluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValueWithResponse(value: ArrayBuffer): Promise<void>;
  writeValueWithoutResponse(value: ArrayBuffer): Promise<void>;
  startNotifications(): Promise<this>;
  stopNotifications(): Promise<void>;
}

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService BluetoothRemoteGATTService} interface.
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
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer BluetoothRemoteGATTServer} interface.
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
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothDevice BluetoothDevice} interface.
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

/** Information from SimpleBLE before connecting. */
export interface RequestDeviceInfo {
  id: string;
  address: string;
  manufacturerData: BluetoothManufacturerDataMap;
}

/** Options for controlling device scanning. */
export interface RequestDeviceOptions {
  /** Select which device to return */
  deviceFound: (device: RequestDeviceInfo) => boolean;
  /** Scanning timeout (5 seconds by default) */
  timeout?: number;
}

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth Bluetooth} interface.
 */
export interface IBluetooth extends EventTarget {
  getAvailability(): Promise<boolean>;
  getDevices(): Promise<IBluetoothDevice[]>;
  requestDevice(options: RequestDeviceOptions): Promise<IBluetoothDevice>;
  requestDevices(options: RequestDeviceOptions): Promise<IBluetoothDevice[]>;
  readonly referringDevice?: IBluetoothDevice;
  onavailabilitychanged: ((this: IBluetooth, ev: Event) => any) | null;
  addEventListener(
    type: "availabilitychanged",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void;
}
