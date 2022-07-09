import { BluetoothRemoteGATTServer } from "./gatt.ts";

import type { Peripheral } from "./ffi.ts";
import type {
  BluetoothAdvertisement,
  IBluetoothDevice,
  IBluetoothRemoteGATTServer,
} from "./interfaces.ts";

/**
 * Represents a single Bluetooth device.
 */
export class BluetoothDevice extends EventTarget implements IBluetoothDevice {
  private _peripheral: Peripheral;
  private _gatt: BluetoothRemoteGATTServer;
  private _adData: BluetoothAdvertisement;

  /** Unique ID identifying this device. */
  readonly id: string;
  readonly name: string;

  /** Device data. */
  get advertisement(): BluetoothAdvertisement {
    return this._adData;
  }

  /** This device's [[BluetoothRemoteGATTServer]]. */
  get gatt(): IBluetoothRemoteGATTServer {
    return this._gatt;
  }

  /** @hidden */
  _setAdData(adData: BluetoothAdvertisement, emit?: boolean): void {
    this._adData = adData;
    if (emit) {
      this.dispatchEvent(new Event("advertisementreceived"));
    }
  }

  /** @hidden */
  constructor(
    peripheral: Peripheral,
    id: string,
    name: string,
    adData: BluetoothAdvertisement,
  ) {
    super();
    this._peripheral = peripheral;
    this.id = id;
    this.name = name;
    this._adData = adData;
    this._gatt = new BluetoothRemoteGATTServer(this, this._peripheral);
    this._setAdData(adData, true);
  }

  /** This unstable specification is not implemented yet. */
  watchAdvertisements(): Promise<void> {
    throw new Error("watchAdvertisements error: not implemented yet");
  }

  /** This unstable specification is not implemented yet. */
  unwatchAdvertisements(): Promise<void> {
    throw new Error("unwatchAdvertisements error: not implemented yet");
  }
}
