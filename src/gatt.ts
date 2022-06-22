import {
  simpleble_peripheral_connect,
  simpleble_peripheral_disconnect,
  simpleble_peripheral_read,
  simpleble_peripheral_services_count,
  simpleble_peripheral_services_get,
  simpleble_peripheral_unsubscribe,
  simpleble_peripheral_write_command,
  simpleble_peripheral_write_request,
} from "./ffi.ts";

import type { Peripheral, Service } from "./ffi.ts";
import type {
  BluetoothCharacteristicProperties,
  IBluetoothDevice,
  IBluetoothRemoteGATTCharacteristic,
  IBluetoothRemoteGATTServer,
  IBluetoothRemoteGATTService,
} from "./interfaces.ts";

/**
 * Implementation of {@link IBluetoothRemoteGATTCharacteristic}.
 */
export class BluetoothRemoteGATTCharacteristic extends EventTarget
  implements IBluetoothRemoteGATTCharacteristic {
  private _peripheral: Peripheral;
  private _service: BluetoothRemoteGATTService;
  private _oncharacteristicvaluechanged?: (ev: Event) => void;
  private _value?: DataView;

  readonly uuid: string;

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    service: BluetoothRemoteGATTService,
    uuid: string,
  ) {
    super();
    this._peripheral = peripheral;
    this._service = service;
    this._value = undefined;
    this.uuid = uuid;
  }

  get service(): IBluetoothRemoteGATTService {
    return this._service;
  }

  get properties(): BluetoothCharacteristicProperties {
    return {
      authenticatedSignedWrites: false,
      broadcast: false,
      indicate: false, // TODO: Change when FFI callbacks are working.
      notify: false, // TODO: Change when FFI callbacks are working.
      read: true,
      reliableWrite: true,
      write: true,
      writeWithoutResponse: true,
    };
  }

  get value(): DataView | undefined {
    return this._value;
  }

  // deno-lint-ignore explicit-module-boundary-types
  set oncharacteristicvaluechanged(fn: (ev: Event) => void) {
    if (this._oncharacteristicvaluechanged) {
      this.removeEventListener(
        "characteristicvaluechanged",
        this._oncharacteristicvaluechanged,
      );
    }
    this._oncharacteristicvaluechanged = fn;
    this.addEventListener(
      "characteristicvaluechanged",
      this._oncharacteristicvaluechanged,
    );
  }

  private setValue(value?: DataView, emit?: boolean): void {
    this._value = value;
    if (emit) {
      this.dispatchEvent(new Event("characteristicvaluechanged"));
      this.service.dispatchEvent(new Event("characteristicvaluechanged"));
      this.service.device.dispatchEvent(
        new Event("characteristicvaluechanged"),
      );
      //this.service.device._bluetooth.dispatchEvent(new Event("characteristicvaluechanged"));
    }
  }

  readValue(): Promise<DataView> {
    const buffer = simpleble_peripheral_read(
      this._peripheral,
      this.service.uuid,
      this.uuid,
    );
    if (!buffer) {
      throw new Error("Error reading value");
    }
    const view = new DataView(buffer);
    this.setValue(view, true);
    return Promise.resolve(view);
  }

  writeValueWithResponse(value: ArrayBuffer): Promise<void> {
    const data = new Uint8Array(value);
    const ret = simpleble_peripheral_write_command(
      this._peripheral,
      this.service.uuid,
      this.uuid,
      data,
    );
    if (!ret) {
      throw new Error("writeValueWithResponse error: command failed");
    }
    const view = new DataView(value);
    this.setValue(view, false);
    return Promise.resolve();
  }

  writeValueWithoutResponse(value: ArrayBuffer): Promise<void> {
    const data = new Uint8Array(value);
    const ret = simpleble_peripheral_write_request(
      this._peripheral,
      this.service.uuid,
      this.uuid,
      data,
    );
    if (!ret) {
      throw new Error("writeValueWithoutResponse error: request failed");
    }
    const view = new DataView(value);
    this.setValue(view, false);
    return Promise.resolve();
  }

  startNotifications(): Promise<this> {
    throw new Error(
      "BluetoothRemoteGATTCharacteristic.startNotifications() not implemented yet",
    );
  }

  stopNotifications(): Promise<void> {
    simpleble_peripheral_unsubscribe(
      this._peripheral,
      this._service.uuid,
      this.uuid,
    );
    return Promise.resolve();
  }
}

/**
 * Implementation of {@link IBluetoothRemoteGATTService}.
 */
export class BluetoothRemoteGATTService extends EventTarget
  implements IBluetoothRemoteGATTService {
  private _peripheral: Peripheral;
  private _service: Service;
  private _device: IBluetoothDevice;

  readonly uuid: string;

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    device: IBluetoothDevice,
    service: Service,
  ) {
    super();
    this._peripheral = peripheral;
    this._service = service;
    this._device = device;
    this.uuid = service.uuid;

    this.dispatchEvent(new Event("serviceadded"));
    this.device.dispatchEvent(new Event("serviceadded"));
  }

  get device(): IBluetoothDevice {
    return this._device;
  }

  get isPrimary(): boolean {
    throw new Error(
      "BluetoothRemoteGATTService.isPrimary() not implemented yet",
    );
  }

  async getCharacteristic(
    uuid: string,
  ): Promise<IBluetoothRemoteGATTCharacteristic> {
    if (!this.device.gatt.connected) {
      throw new Error("getCharacteristic error: device not connected");
    } else if (!uuid) {
      throw new Error("getCharacteristic error: no characteristic given");
    }
    const chars = await this.getCharacteristics(uuid);
    if (chars.length === 0) {
      throw new Error(
        "getCharacteristic error: characteristic not found",
      );
    }
    return Promise.resolve(chars[0]);
  }

  getCharacteristics(
    uuid?: string,
  ): Promise<IBluetoothRemoteGATTCharacteristic[]> {
    if (!this.device.gatt.connected) {
      throw new Error("getCharacteristics error: device not connected");
    }
    const chars: IBluetoothRemoteGATTCharacteristic[] = [];
    for (const char of this._service.characteristics) {
      if (uuid) {
        if (char !== uuid) {
          continue;
        }
      }
      const characteristic = new BluetoothRemoteGATTCharacteristic(
        this._peripheral,
        this,
        char,
      );
      chars.push(characteristic);
    }
    return Promise.resolve(chars);
  }
}

/**
 * Implementation of {@link IBluetoothRemoteGATTServer}.
 */
export class BluetoothRemoteGATTServer extends EventTarget
  implements IBluetoothRemoteGATTServer {
  private _peripheral: Peripheral;
  private _device: IBluetoothDevice;
  private _connected: boolean;

  /** @hidden */
  constructor(device: IBluetoothDevice, peripheral: Peripheral) {
    super();
    this._device = device;
    this._peripheral = peripheral;
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  get device(): IBluetoothDevice {
    return this._device;
  }

  connect(): Promise<IBluetoothRemoteGATTServer> {
    const ret = simpleble_peripheral_connect(this._peripheral);
    if (!ret) {
      throw new Error("connect failed: device refused to connect");
    }
    this._connected = true;
    return Promise.resolve(this);
  }

  disconnect(): void {
    const ret = simpleble_peripheral_disconnect(this._peripheral);
    this._connected = false;
    if (!ret) {
      throw new Error("disconnect failed: unknown error");
    }
  }

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

  getPrimaryServices(uuid?: string): Promise<IBluetoothRemoteGATTService[]> {
    const count = simpleble_peripheral_services_count(this._peripheral);
    const services: IBluetoothRemoteGATTService[] = [];
    for (let i = 0; i < count; i++) {
      const handle = simpleble_peripheral_services_get(this._peripheral, i);
      if (uuid) {
        if (handle.uuid !== uuid) {
          continue;
        }
      }
      const service = new BluetoothRemoteGATTService(
        this._peripheral,
        this._device,
        handle,
      );
      services.push(service);
    }
    return Promise.resolve(services);
  }
}
