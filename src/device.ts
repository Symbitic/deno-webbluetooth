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
  #peripheral: Peripheral;
  #gatt: BluetoothRemoteGATTServer;
  #adData: BluetoothAdvertisement;

  /** Unique ID identifying this device. */
  readonly id: string;
  /** Device name (may be empty). */
  readonly name: string;

  /** Device data. */
  get advertisement(): BluetoothAdvertisement {
    return this.#adData;
  }

  /** This device's BluetoothRemoteGATTServer. */
  get gatt(): IBluetoothRemoteGATTServer {
    return this.#gatt;
  }

  #setAdData(adData: BluetoothAdvertisement, emit?: boolean): void {
    this.#adData = adData;
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
    this.#peripheral = peripheral;
    this.id = id;
    this.name = name;
    this.#adData = adData;
    this.#gatt = new BluetoothRemoteGATTServer(this, this.#peripheral);
    this.#setAdData(adData, true);
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
