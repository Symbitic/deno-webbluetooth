import { delay } from "./deps.ts";
import { BluetoothDevice } from "./gatt.ts";
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
} from "./ffi.ts";

import type {
  BluetoothLEScanFilter,
  BluetoothManufacturerDataFilter,
  BluetoothManufacturerDataMap,
  RequestDeviceInfo,
  RequestDeviceOptions,
} from "./interfaces.ts";
import type { Adapter } from "./ffi.ts";

function isView(
  source: ArrayBuffer | ArrayBufferView,
): source is ArrayBufferView {
  return (source as ArrayBufferView).buffer !== undefined;
}

function checkManufacturerData(
  map: BluetoothManufacturerDataMap,
  filters: BluetoothManufacturerDataFilter[],
): boolean {
  for (const filter of filters) {
    const { companyIdentifier, dataPrefix } = filter;
    // Company ID not found; not a match.
    if (!map.has(companyIdentifier)) {
      continue;
    }
    // If no dataPrefix, then the match was successful.
    if (!dataPrefix) {
      return true;
    }
    const arrayBuffer = isView(dataPrefix) ? dataPrefix.buffer : dataPrefix;
    const view = map.get(companyIdentifier)!;
    const bytes = new Uint8Array(arrayBuffer);
    const values: boolean[] = [];
    for (const [i, b] of bytes.entries()) {
      const a = view.getUint8(i);
      values[i] = a === b;
    }
    const valid = values.every((val) => val);
    if (valid) {
      return true;
    }
  }

  return false;
}

/** Interface for creating {@link BluetoothDevice} objects. */
export class Bluetooth extends EventTarget {
  #adapter: Adapter;
  #devices: BluetoothDevice[];

  /** Since Deno cannot navigate by Bluetooth URL, this will never be present. */
  readonly referringDevice?: BluetoothDevice = undefined;

  /** @hidden */
  constructor() {
    super();
    this.#devices = [];

    // NOTE: a global `bluetooth` variable cannot be exported while the
    // constructor throws an error. Maybe move this.
    const adaptersCount = simpleble_adapter_get_count();
    if (adaptersCount === 0n) {
      throw new Deno.errors.NotFound("requestDevice error: no adapters found");
    }

    this.#adapter = simpleble_adapter_get_handle(0);

    this.dispatchEvent(new Event("availabilitychanged"));
  }

  /** Determines if a working Bluetooth adapter is usable. */
  getAvailability(): Promise<boolean> {
    const count = simpleble_adapter_get_count();
    return Promise.resolve(count > 0);
  }

  /** Returns a list of every device requested thus far. */
  getDevices(): Promise<BluetoothDevice[]> {
    return Promise.resolve(this.#devices);
  }

  /**
   * Scan for Bluetooth devices indefinitely.
   *
   * This function is not a part of the WebBluetooth standard. It was made as
   * a convenience function for long-running programs.
   */
  async *scan(
    options: RequestDeviceOptions,
  ): AsyncIterableIterator<BluetoothDevice> {
    const timeout = options.timeout ?? 200;
    const ids: string[] = [];
    const { filter, filters } = options as any;

    if (!filters && !filter) {
      throw new TypeError("filter or filters must be given");
    }

    const filterCb = this.#createFilter(options);

    while (true) {
      simpleble_adapter_scan_start(this.#adapter);
      await delay(timeout);
      simpleble_adapter_scan_stop(this.#adapter);

      const resultsCount = simpleble_adapter_scan_get_results_count(
        this.#adapter,
      );

      for (let i = 0; i < resultsCount; i++) {
        const d = simpleble_adapter_scan_get_results_handle(this.#adapter, i);
        const id = simpleble_peripheral_identifier(d);
        if (ids.includes(id)) {
          simpleble_peripheral_release_handle(d);
          continue;
        }
        const address = simpleble_peripheral_address(d);
        const count = simpleble_peripheral_manufacturer_data_count(d);
        const manufacturerData: BluetoothManufacturerDataMap = new Map();
        for (let j = 0; j < count; j++) {
          const data = simpleble_peripheral_manufacturer_data_get(d, j);
          if (data) {
            manufacturerData.set(data.id, new DataView(data.data.buffer));
          }
        }
        const found = filterCb({
          name: id,
          address,
          manufacturerData,
        });
        if (found) {
          const device = new BluetoothDevice(
            this.#adapter,
            i,
            d,
            address,
            id,
            manufacturerData,
          );
          ids.push(id);
          yield device;
        }
        simpleble_peripheral_release_handle(d);
      }
    }
  }

  #createFilter(options: any): (info: RequestDeviceInfo) => boolean {
    if (!options.filters && !options.filter) {
      throw new TypeError("filter or filters must be given");
    } else if (options.filter) {
      return options.filter;
    }

    const cb = (info: RequestDeviceInfo): boolean => {
      return this.#filterDevice(options.filters, info);
    };
    return cb;
  }

  #filterDevice(
    filters: BluetoothLEScanFilter[],
    info: RequestDeviceInfo,
  ): boolean {
    for (const filter of filters) {
      if (filter.name && filter.name !== info.name) {
        continue;
      }
      if (filter.namePrefix && !info.name.startsWith(filter.namePrefix)) {
        continue;
      }
      if (
        filter.manufacturerData &&
        !checkManufacturerData(info.manufacturerData, filter.manufacturerData)
      ) {
        continue;
      }
      if (filter.services) {
        throw new Error("Filters is not supported yet");
      }
      return true;
    }
    return false;
  }

  async #request(
    options: any,
    singleDevice: boolean,
  ): Promise<BluetoothDevice[]> {
    const timeout = options.timeout ?? 5000;

    if (!options.filters && !options.filter) {
      throw new TypeError("filter or filters must be given");
    }

    const filterCb = this.#createFilter(options);

    simpleble_adapter_scan_start(this.#adapter);
    await delay(timeout);
    simpleble_adapter_scan_stop(this.#adapter);

    const resultsCount = simpleble_adapter_scan_get_results_count(
      this.#adapter,
    );

    const devices: BluetoothDevice[] = [];

    for (let i = 0; i < resultsCount; i++) {
      const d = simpleble_adapter_scan_get_results_handle(this.#adapter, i);
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
      const found = filterCb({
        name: id,
        address,
        manufacturerData,
      });
      if (found) {
        const device = new BluetoothDevice(
          this.#adapter,
          i,
          d,
          address,
          id,
          manufacturerData,
        );
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
  ): Promise<BluetoothDevice> {
    const devices = await this.#request(options, true);

    if (!devices.length) {
      throw new Deno.errors.NotFound("requestDevice error: no devices found");
    }

    this.#devices.push(devices[0]);
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
  ): Promise<BluetoothDevice[]> {
    const devices = await this.#request(options, true);

    if (!devices.length) {
      throw new Deno.errors.NotFound("requestDevices error: no devices found");
    }

    this.#devices.push(...devices);
    return devices;
  }
}
