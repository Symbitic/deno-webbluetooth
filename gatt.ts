import {
  simpleble_peripheral_connect,
  simpleble_peripheral_disconnect,
  simpleble_peripheral_indicate,
  simpleble_peripheral_notify,
  simpleble_peripheral_read,
  simpleble_peripheral_read_descriptor,
  simpleble_peripheral_services_count,
  simpleble_peripheral_services_get,
  simpleble_peripheral_set_callback_on_disconnected,
  simpleble_peripheral_unsubscribe,
  simpleble_peripheral_write_command,
  simpleble_peripheral_write_descriptor,
  simpleble_peripheral_write_request,
} from "./ffi.ts";

import type { Characteristic, Peripheral, Service } from "./ffi.ts";
import type {
  BluetoothCharacteristicProperties,
  BluetoothManufacturerDataMap,
} from "./interfaces.ts";

/**
 * A GATT Descriptor containing more information about a characteristic's value.
 *
 * See also: {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTDescriptor BluetoothRemoteGATTDescriptor}
 */
export class BluetoothRemoteGATTDescriptor extends EventTarget {
  #peripheral: Peripheral;
  #value?: DataView;
  #char: BluetoothRemoteGATTCharacteristic;
  #service: BluetoothRemoteGATTService;

  /** The UUID of this descriptor. */
  readonly uuid: string;

  /** The characteristic this descriptor belongs to. */
  get characteristic(): BluetoothRemoteGATTCharacteristic {
    return this.#char;
  }

  /** The current descriptor value. */
  get value(): DataView {
    if (!this.#value) {
      throw new Deno.errors.InvalidData("Descriptor value not available yet");
    }
    return this.#value;
  }

  /** @private */
  constructor(
    peripheral: Peripheral,
    service: BluetoothRemoteGATTService,
    char: BluetoothRemoteGATTCharacteristic,
    uuid: string,
  ) {
    super();
    this.#peripheral = peripheral;
    this.#char = char;
    this.#service = service;
    this.uuid = uuid;
  }

  /** Resolves to a DataView containing a copy of the `value` property. */
  readValue(): Promise<DataView> {
    const data = simpleble_peripheral_read_descriptor(
      this.#peripheral,
      this.#service.uuid,
      this.#char.uuid,
      this.uuid,
    );
    if (!data) {
      throw new Deno.errors.BadResource("Descriptor is no longer valid");
    }
    const view = new DataView(data);
    this.#value = view;
    return Promise.resolve(view);
  }

  /** Updates the value of a descriptor. */
  writeValue(value: ArrayBuffer): Promise<void> {
    const data = new Uint8Array(value);
    const ret = simpleble_peripheral_write_descriptor(
      this.#peripheral,
      this.#service.uuid,
      this.#char.uuid,
      this.uuid,
      data,
    );
    if (!ret) {
      throw new Deno.errors.BadResource("Descriptor is no longer valid");
    }

    const view = new DataView(value);
    this.#value = view;
    return Promise.resolve();
  }
}

/**
 * A basic data element about a GATT service.
 *
 * See also: {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic BluetoothRemoteGATTCharacteristic}
 */
export class BluetoothRemoteGATTCharacteristic extends EventTarget {
  #peripheral: Peripheral;
  #characteristic: Characteristic;
  #service: BluetoothRemoteGATTService;
  #value?: DataView;

  /** The UUID of this characteristic */
  readonly uuid: string;

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    service: BluetoothRemoteGATTService,
    characteristic: Characteristic,
  ) {
    super();
    this.#peripheral = peripheral;
    this.#service = service;
    this.#characteristic = characteristic;
    this.#value = undefined;
    this.uuid = characteristic.uuid;
  }

  /** Register for the `characteristicvaluechanged` event. */
  addEventListener(
    type: "characteristicvaluechanged",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void {
    super.addEventListener(type, listener, useCapture);
  }

  /** The {@link BluetoothRemoteGATTService} this characteristic belongs to. */
  get service(): BluetoothRemoteGATTService {
    return this.#service;
  }

  /** Read-only properties of this characteristic. */
  get properties(): BluetoothCharacteristicProperties {
    return {
      authenticatedSignedWrites: false,
      broadcast: false,
      indicate: true,
      notify: true,
      read: true,
      reliableWrite: true,
      write: true,
      writeWithoutResponse: true,
    };
  }

  /**
   * The current value of this characteristic.
   *
   * This value gets updated when the value of the characteristic is read or
   * updated via a notification or indication.
   */
  get value(): DataView | undefined {
    return this.#value;
  }

  /** Update the value and emit events. */
  #setValue(value?: DataView, emit?: boolean): void {
    this.#value = value;
    if (emit) {
      this.dispatchEvent(new Event("characteristicvaluechanged"));
    }
  }

  /** Resolves a single descriptor. */
  async getDescriptor(uuid: string): Promise<BluetoothRemoteGATTDescriptor> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    }

    const descriptors = await this.getDescriptors(uuid);
    if (!descriptors.length) {
      throw new Deno.errors.NotFound("No descriptors found");
    }
    return descriptors[0];
  }

  /** Resolves multiple descriptors. */
  getDescriptors(uuid?: string): Promise<BluetoothRemoteGATTDescriptor[]> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    }
    const descriptors: BluetoothRemoteGATTDescriptor[] = [];
    for (const descriptorUuid of this.#characteristic.descriptors) {
      if (uuid) {
        if (descriptorUuid !== uuid) {
          continue;
        }
      }
      const descriptor = new BluetoothRemoteGATTDescriptor(
        this.#peripheral,
        this.#service,
        this,
        descriptorUuid,
      );
      descriptors.push(descriptor);
    }
    return Promise.resolve(descriptors);
  }

  /** Returns the current value */
  readValue(): Promise<DataView> {
    const buffer = simpleble_peripheral_read(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
    );
    if (!buffer) {
      throw new Deno.errors.BadResource("Characteristic is no longer valid");
    }
    const view = new DataView(buffer);
    this.#setValue(view, true);
    return Promise.resolve(view);
  }

  /** Write a value, requiring a response to be successful. */
  writeValueWithResponse(value: ArrayBuffer): Promise<void> {
    const data = new Uint8Array(value);
    const ret = simpleble_peripheral_write_command(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
      data,
    );
    if (!ret) {
      throw new Deno.errors.BadResource(
        "Error while writing a command to a characteristic",
      );
    }
    const view = new DataView(value);
    this.#setValue(view, false);
    return Promise.resolve();
  }

  /** Writes a value, with or without a response. */
  writeValueWithoutResponse(value: ArrayBuffer): Promise<void> {
    const data = new Uint8Array(value);
    const ret = simpleble_peripheral_write_request(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
      data,
    );
    if (!ret) {
      throw new Deno.errors.BadResource(
        "Error while writing a request to a characteristic",
      );
    }
    const view = new DataView(value);
    this.#setValue(view, false);
    return Promise.resolve();
  }

  /** Begin subscribing to value updates. */
  startNotifications(): Promise<this> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    }
    simpleble_peripheral_notify(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
      (_service: string, _char: string, data: Uint8Array) => {
        const arrayBuffer = data.buffer;
        const view = new DataView(arrayBuffer);
        this.#setValue(view, true);
      },
    );
    simpleble_peripheral_indicate(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
      (_service: string, _char: string, data: Uint8Array) => {
        const arrayBuffer = data.buffer;
        const view = new DataView(arrayBuffer);
        this.#setValue(view, true);
      },
    );
    return Promise.resolve(this);
  }

  /** Stop listening for value updates. */
  stopNotifications(): Promise<void> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    }
    simpleble_peripheral_unsubscribe(
      this.#peripheral,
      this.#service.uuid,
      this.uuid,
    );
    return Promise.resolve();
  }
}

/**
 * A service provided by a GATT server.
 *
 * See also: {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService BluetoothRemoteGATTService}
 */
export class BluetoothRemoteGATTService extends EventTarget {
  #peripheral: Peripheral;
  #service: Service;
  #device: BluetoothDevice;

  /** The UUID of this service. */
  readonly uuid: string;

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    device: BluetoothDevice,
    service: Service,
  ) {
    super();
    this.#peripheral = peripheral;
    this.#service = service;
    this.#device = device;
    this.uuid = service.uuid;

    this.dispatchEvent(new Event("serviceadded"));
    this.device.dispatchEvent(new Event("serviceadded"));
  }

  /** Register for the `serviceadded` event. */
  addEventListener(
    type: "serviceadded",
    listener: (this: this, ev: Event) => any,
    useCapture?: boolean,
  ): void {
    super.addEventListener(type, listener, useCapture);
  }

  /** The {@link BluetoothDevice} this service belongs to. */
  get device(): BluetoothDevice {
    return this.#device;
  }

  /** Indicates if this is a primary or secondard service. Always true for now. */
  get isPrimary(): boolean {
    return true;
  }

  /** Returns the characteristic for a given UUID. */
  async getCharacteristic(
    uuid: string,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!this.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    } else if (!uuid) {
      throw new TypeError("No characteristic UUID given");
    }
    const chars = await this.getCharacteristics(uuid);
    if (chars.length === 0) {
      throw new Deno.errors.NotFound("No matching characteristics found");
    }
    return Promise.resolve(chars[0]);
  }

  /** Returns a list of characteristics this service contains. */
  getCharacteristics(
    uuid?: string,
  ): Promise<BluetoothRemoteGATTCharacteristic[]> {
    if (!this.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    }
    const chars: BluetoothRemoteGATTCharacteristic[] = [];
    for (const char of this.#service.characteristics) {
      if (uuid) {
        if (char.uuid !== uuid) {
          continue;
        }
      }
      const characteristic = new BluetoothRemoteGATTCharacteristic(
        this.#peripheral,
        this,
        char,
      );
      chars.push(characteristic);
    }
    return Promise.resolve(chars);
  }
}

/**
 * A GATT server running on a remote device.
 *
 * See also: {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer BluetoothRemoteGATTServer}
 */
export class BluetoothRemoteGATTServer extends EventTarget {
  #peripheral: Peripheral;
  #device: BluetoothDevice;
  #connected: boolean;

  /** @hidden */
  constructor(device: BluetoothDevice, peripheral: Peripheral) {
    super();
    this.#device = device;
    this.#peripheral = peripheral;
    this.#connected = false;
  }

  /** Returns true while this device is connected. */
  get connected(): boolean {
    return this.#connected;
  }

  /** The {@link BluetoothDevice} running this server. */
  get device(): BluetoothDevice {
    return this.#device;
  }

  #setConnected(status: boolean): void {
    this.#connected = status;
  }

  /** Begins connecting to this device. */
  connect(): Promise<BluetoothRemoteGATTServer> {
    const ret = simpleble_peripheral_connect(this.#peripheral);
    if (!ret) {
      throw new Deno.errors.ConnectionRefused("Device refused to connect");
    }
    this.#setConnected(true);
    simpleble_peripheral_set_callback_on_disconnected(this.#peripheral, () => {
      this.#setConnected(false);
    });
    return Promise.resolve(this);
  }

  /** Disconnect from this device. */
  disconnect(): void {
    simpleble_peripheral_disconnect(this.#peripheral);
    this.#setConnected(false);
  }

  /** Returns the service for a UUID. */
  async getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService> {
    if (!this.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    } else if (!uuid) {
      throw new TypeError("No service UUID given");
    }
    const services = await this.getPrimaryServices(uuid);
    if (services.length === 0) {
      throw new Deno.errors.NotFound("No matching characteristics found");
    }
    return Promise.resolve(services[0]);
  }

  /** Returns a list of services for this device. */
  getPrimaryServices(uuid?: string): Promise<BluetoothRemoteGATTService[]> {
    if (!this.device.gatt.connected) {
      throw new Deno.errors.NotConnected("Device not connected");
    }

    const count = simpleble_peripheral_services_count(this.#peripheral);
    const services: BluetoothRemoteGATTService[] = [];
    for (let i = 0; i < count; i++) {
      const handle = simpleble_peripheral_services_get(this.#peripheral, i);
      if (uuid) {
        if (handle.uuid !== uuid) {
          continue;
        }
      }
      const service = new BluetoothRemoteGATTService(
        this.#peripheral,
        this.#device,
        handle,
      );
      services.push(service);
    }
    return Promise.resolve(services);
  }
}

/**
 * Represents a single Bluetooth device.
 *
 * See also: {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothDevice BluetoothDevice}
 */
export class BluetoothDevice extends EventTarget {
  #peripheral: Peripheral;
  #gatt: BluetoothRemoteGATTServer;
  #manufacturerData: BluetoothManufacturerDataMap;

  /** Unique ID identifying this device. */
  readonly id: string;
  /** Device name (may be empty). */
  readonly name: string;

  /** Manufacturer data. */
  get manufacturerData(): BluetoothManufacturerDataMap {
    return this.#manufacturerData;
  }

  /** This device's BluetoothRemoteGATTServer. */
  get gatt(): BluetoothRemoteGATTServer {
    return this.#gatt;
  }

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    id: string,
    name: string,
    manufacturerData: BluetoothManufacturerDataMap,
  ) {
    super();
    this.#peripheral = peripheral;
    this.id = id;
    this.name = name;
    this.#manufacturerData = manufacturerData;
    this.#gatt = new BluetoothRemoteGATTServer(this, this.#peripheral);
  }

  /** This unstable specification is not implemented yet. */
  watchAdvertisements(): Promise<void> {
    throw new Deno.errors.NotSupported(
      "watchAdvertisements is not implemented yet",
    );
  }

  /** This unstable specification is not implemented yet. */
  unwatchAdvertisements(): Promise<void> {
    throw new Deno.errors.NotSupported(
      "unwatchAdvertisements not is implemented yet",
    );
  }
}
