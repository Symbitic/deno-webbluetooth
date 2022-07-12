import {
  simpleble_peripheral_connect,
  simpleble_peripheral_disconnect,
  simpleble_peripheral_indicate,
  simpleble_peripheral_notify,
  simpleble_peripheral_read,
  simpleble_peripheral_services_count,
  simpleble_peripheral_services_get,
  simpleble_peripheral_set_callback_on_disconnected,
  simpleble_peripheral_unsubscribe,
  simpleble_peripheral_write_command,
  simpleble_peripheral_write_request,
} from "./ffi.ts";

import type { Peripheral, Service } from "./ffi.ts";
import type {
  BluetoothCharacteristicProperties,
  IBluetoothDevice,
  IBluetoothRemoteGATTCharacteristic,
  IBluetoothRemoteGATTDescriptor,
  IBluetoothRemoteGATTServer,
  IBluetoothRemoteGATTService,
} from "./interfaces.ts";

/**
 * A GATT Descriptor containing more information about a characteristic's value.
 *
 * Implementation of {@link IBluetoothRemoteGATTDescriptor}.
 */
export class BluetoothRemoteGATTDescriptor extends EventTarget
  implements IBluetoothRemoteGATTDescriptor {
  #peripheral: Peripheral;
  #value?: Uint8Array;
  #char: IBluetoothRemoteGATTCharacteristic;

  /** The UUID of this descriptor. */
  readonly uuid: string;

  /** The characteristic this descriptor belongs to. */
  get characteristic(): IBluetoothRemoteGATTCharacteristic {
    return this.#char;
  }

  /** The current descriptor value. */
  get value(): ArrayBuffer {
    if (!this.#value) {
      throw new Deno.errors.InvalidData("Descriptor value not available yet");
    }
    return this.#value.buffer;
  }

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    char: IBluetoothRemoteGATTCharacteristic,
    uuid: string,
  ) {
    super();
    this.#peripheral = peripheral;
    this.#char = char;
    this.uuid = uuid;
  }

  /** Resolves to an ArrayBuffer containing a copy of the `value` property. */
  readValue(): Promise<ArrayBuffer> {
    return Promise.resolve(this.value);
  }

  /** NOT IMPLEMENTED YET! */
  writeValue(_array: ArrayBuffer): Promise<void> {
    throw new Error(
      "BluetoothRemoteGATTDescriptor.writeValue() not implemented yet",
    );
  }
}

/**
 * A basic data element about a GATT service.
 *
 * Implementation of {@link IBluetoothRemoteGATTCharacteristic}.
 */
export class BluetoothRemoteGATTCharacteristic extends EventTarget
  implements IBluetoothRemoteGATTCharacteristic {
  #peripheral: Peripheral;
  #service: BluetoothRemoteGATTService;
  #oncharacteristicvaluechanged?: (ev: Event) => void;
  #value?: DataView;

  /** The UUID of this characteristic */
  readonly uuid: string;

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    service: BluetoothRemoteGATTService,
    uuid: string,
  ) {
    super();
    this.#peripheral = peripheral;
    this.#service = service;
    this.#value = undefined;
    this.uuid = uuid;
  }

  /** The {@link BluetoothRemoteGATTService} this characteristic belongs to. */
  get service(): IBluetoothRemoteGATTService {
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

  /** Event handler for the `characteristicvaluechanged` event. */
  // deno-lint-ignore explicit-module-boundary-types
  set oncharacteristicvaluechanged(fn: (ev: Event) => void) {
    if (this.#oncharacteristicvaluechanged) {
      this.removeEventListener(
        "characteristicvaluechanged",
        this.#oncharacteristicvaluechanged,
      );
    }
    this.#oncharacteristicvaluechanged = fn;
    this.addEventListener(
      "characteristicvaluechanged",
      this.#oncharacteristicvaluechanged,
    );
  }

  /** Update the value and emit events. */
  #setValue(value?: DataView, emit?: boolean): void {
    this.#value = value;
    if (emit) {
      this.dispatchEvent(new Event("characteristicvaluechanged"));
      this.service.dispatchEvent(new Event("characteristicvaluechanged"));
      this.service.device.dispatchEvent(
        new Event("characteristicvaluechanged"),
      );
      //this.service.device._bluetooth.dispatchEvent(new Event("characteristicvaluechanged"));
    }
  }

  /** Resolves a single descriptor. */
  async getDescriptor(uuid: string): Promise<IBluetoothRemoteGATTDescriptor> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected(
        "getDescriptor error: device not connected",
      );
    } else if (!uuid) {
      throw new Error("No UUID given");
    }

    const descriptors = await this.getDescriptors(uuid);
    if (!descriptors.length) {
      throw new Deno.errors.NotFound(
        "getDescriptor error: no descriptors found",
      );
    }
    return descriptors[0];
  }

  /** Resolves multiple descriptors. */
  getDescriptors(_uuid?: string): Promise<IBluetoothRemoteGATTDescriptor[]> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected(
        "getDescriptors error: device not connected",
      );
    }
    return Promise.reject("getDescriptors error: not implemented yet");
  }

  /** Returns the current value */
  readValue(): Promise<DataView> {
    const buffer = simpleble_peripheral_read(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
    );
    if (!buffer) {
      throw new Error("readValue error: unable to read data");
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
      throw new Error("writeValueWithResponse error: command failed");
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
      throw new Error("writeValueWithoutResponse error: request failed");
    }
    const view = new DataView(value);
    this.#setValue(view, false);
    return Promise.resolve();
  }

  /** Begin subscribing to value updates. */
  startNotifications(): Promise<this> {
    if (!this.service.device.gatt.connected) {
      throw new Deno.errors.NotConnected(
        "startNotifications error: device not connected",
      );
    }
    simpleble_peripheral_notify(
      this.#peripheral,
      this.service.uuid,
      this.uuid,
      (_service: string, _char: string, data: Uint8Array) => {
        console.log("NOTIFY");
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
        console.log("INDICATE");
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
      throw new Deno.errors.NotConnected(
        "stopNotifications error: device not connected",
      );
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
 * Implementation of {@link IBluetoothRemoteGATTService}.
 */
export class BluetoothRemoteGATTService extends EventTarget
  implements IBluetoothRemoteGATTService {
  #peripheral: Peripheral;
  #service: Service;
  #device: IBluetoothDevice;

  /** The UUID of this service. */
  readonly uuid: string;

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    device: IBluetoothDevice,
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

  /** The {@link BluetoothDevice} this service belongs to. */
  get device(): IBluetoothDevice {
    return this.#device;
  }

  /** Indicates if this is a primary or secondard service. Always true for now. */
  get isPrimary(): boolean {
    return true;
  }

  /** Returns the characteristic for a given UUID. */
  async getCharacteristic(
    uuid: string,
  ): Promise<IBluetoothRemoteGATTCharacteristic> {
    if (!this.device.gatt.connected) {
      throw new Deno.errors.NotConnected(
        "getCharacteristic error: device not connected",
      );
    } else if (!uuid) {
      throw new Error("getCharacteristic error: no characteristic given");
    }
    const chars = await this.getCharacteristics(uuid);
    if (chars.length === 0) {
      throw new Deno.errors.NotFound(
        "getCharacteristic error: characteristic not found",
      );
    }
    return Promise.resolve(chars[0]);
  }

  /** Returns a list of characteristics this service contains. */
  getCharacteristics(
    uuid?: string,
  ): Promise<IBluetoothRemoteGATTCharacteristic[]> {
    if (!this.device.gatt.connected) {
      throw new Deno.errors.NotConnected(
        "getCharacteristics error: device not connected",
      );
    }
    const chars: IBluetoothRemoteGATTCharacteristic[] = [];
    for (const char of this.#service.characteristics) {
      if (uuid) {
        if (char !== uuid) {
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
 * Implementation of {@link IBluetoothRemoteGATTServer}.
 */
export class BluetoothRemoteGATTServer extends EventTarget
  implements IBluetoothRemoteGATTServer {
  #peripheral: Peripheral;
  #device: IBluetoothDevice;
  #connected: boolean;

  /** @hidden */
  constructor(device: IBluetoothDevice, peripheral: Peripheral) {
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
  get device(): IBluetoothDevice {
    return this.#device;
  }

  #setConnected(status: boolean): void {
    this.#connected = status;
  }

  /** Begins connecting to this device. */
  connect(): Promise<IBluetoothRemoteGATTServer> {
    const ret = simpleble_peripheral_connect(this.#peripheral);
    if (!ret) {
      throw new Deno.errors.ConnectionRefused(
        "connect failed: device refused to connect",
      );
    }
    this.#setConnected(true);
    simpleble_peripheral_set_callback_on_disconnected(this.#peripheral, () => {
      console.log("DISCONNECTED");
      this.#setConnected(false);
    });
    return Promise.resolve(this);
  }

  /** Disconnect from this device. */
  disconnect(): void {
    const ret = simpleble_peripheral_disconnect(this.#peripheral);
    if (!ret) {
      throw new Error("disconnect failed: unknown error");
    }
    this.#setConnected(false);
  }

  /** Returns the service for a UUID. */
  async getPrimaryService(uuid: string): Promise<IBluetoothRemoteGATTService> {
    if (!uuid) {
      throw new Error("getPrimaryService error: no service given");
    }
    const services = await this.getPrimaryServices(uuid);
    if (services.length === 0) {
      throw new Error("getPrimaryService error: no services found");
    }
    return Promise.resolve(services[0]);
  }

  /** Returns a list of services for this device. */
  getPrimaryServices(uuid?: string): Promise<IBluetoothRemoteGATTService[]> {
    const count = simpleble_peripheral_services_count(this.#peripheral);
    const services: IBluetoothRemoteGATTService[] = [];
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
