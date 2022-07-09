import { delay } from "../deps.ts";
import { BluetoothDevice } from "./device.ts";
import {
  simpleble_adapter_get_count,
  simpleble_adapter_get_handle,
  simpleble_adapter_scan_get_results_count,
  simpleble_adapter_scan_get_results_handle,
  simpleble_adapter_scan_start,
  simpleble_adapter_scan_stop,
  simpleble_peripheral_address,
  simpleble_peripheral_identifier,
  simpleble_peripheral_manufacturer_data_count,
  simpleble_peripheral_manufacturer_data_get,
  simpleble_peripheral_release_handle,
  simpleble_peripheral_rssi,
} from "./ffi.ts";

import type {
  BluetoothManufacturerDataMap,
  IBluetooth,
  IBluetoothDevice,
  RequestDeviceOptions,
} from "./interfaces.ts";
import type { Adapter } from "./ffi.ts";

/**
 * Interface for creating [[BluetoothDevice]] objects.
 */
export class Bluetooth extends EventTarget implements IBluetooth {
  private _adapter: Adapter;
  private _devices: IBluetoothDevice[];
  private _onavailabilitychanged?: (ev: Event) => void;

  /** Since Deno cannot navigate by Bluetooth URL, this will never be present. */
  readonly referringDevice?: IBluetoothDevice = undefined;

  constructor() {
    super();
    this._devices = [];

    // NOTE: a global `bluetooth` variable cannot be exported while the
    // constructor throws an error. Maybe move this.
    const adaptersCount = simpleble_adapter_get_count();
    if (adaptersCount === 0n) {
      throw new Deno.errors.NotFound("requestDevice error: no adapters found");
    }

    this._adapter = simpleble_adapter_get_handle(0);

    this.dispatchEvent(new Event("availabilitychanged"));
  }

  /** Event handler for the `availabilitychanged` event. */
  // deno-lint-ignore explicit-module-boundary-types
  set onavailabilitychanged(fn: (ev: Event) => void) {
    if (this._onavailabilitychanged) {
      this.removeEventListener(
        "availabilitychanged",
        this._onavailabilitychanged,
      );
    }
    this._onavailabilitychanged = fn;
    this.addEventListener("availabilitychanged", this._onavailabilitychanged);
  }

  /** Determines if a working Bluetooth adapter is usable. */
  getAvailability(): Promise<boolean> {
    const count = simpleble_adapter_get_count();
    return Promise.resolve(count > 0);
  }

  /** Returns a list of every device requested thus far. */
  getDevices(): Promise<IBluetoothDevice[]> {
    return Promise.resolve(this._devices);
  }

  /** @hidden */
  private async request(
    options: RequestDeviceOptions,
    singleDevice: boolean,
  ): Promise<IBluetoothDevice[]> {
    const timeout = options.timeout ?? 5000;

    simpleble_adapter_scan_start(this._adapter);
    await delay(timeout);
    simpleble_adapter_scan_stop(this._adapter);

    const resultsCount = simpleble_adapter_scan_get_results_count(
      this._adapter,
    );

    const devices: IBluetoothDevice[] = [];

    for (let i = 0; i < resultsCount; i++) {
      const d = simpleble_adapter_scan_get_results_handle(this._adapter, i);
      const id = simpleble_peripheral_identifier(d);
      const address = simpleble_peripheral_address(d);
      const count = simpleble_peripheral_manufacturer_data_count(d);
      const manufacturerData: BluetoothManufacturerDataMap = new Map();
      for (let j = 0; j < count; j++) {
        const data = simpleble_peripheral_manufacturer_data_get(d, j);
        if (data) {
          manufacturerData.set(data.id, new DataView(data.data.buffer));
        }
      }
      const found = options.deviceFound({ id, address, manufacturerData });
      if (found) {
        const rssi = simpleble_peripheral_rssi(d);
        const device = new BluetoothDevice(d, address, id, {
          rssi,
          manufacturerData,
        });
        devices.push(device);
        if (singleDevice) {
          break;
        }
      }
      simpleble_peripheral_release_handle(d);
    }

    return devices;
  }

  /**
   * Scans for a Bluetooth device.
   *
   * Because of limitations in the WebBluetooth standard, this does not comply
   * with the standard `requestDevice` specification. In the W3C standard,
   * users manually select a device via a popup, which is obviously not
   * possible with Deno.
   */
  async requestDevice(
    options: RequestDeviceOptions,
  ): Promise<IBluetoothDevice> {
    const devices = await this.request(options, true);

    if (!devices.length) {
      throw new Deno.errors.NotFound("requestDevice error: no devices found");
    }

    this._devices.push(devices[0]);
    return devices[0];
  }

  /**
   * Scans for Bluetooth devices.
   *
   * This function is not a part of the WebBluetooth standard. It is made
   * to allow programs to interact with multiple devices.
   */
  async requestDevices(
    options: RequestDeviceOptions,
  ): Promise<IBluetoothDevice[]> {
    const devices = await this.request(options, true);

    if (!devices.length) {
      throw new Deno.errors.NotFound("requestDevices error: no devices found");
    }

    this._devices.push(...devices);
    return devices;
  }
}
