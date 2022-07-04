import { Plug } from "../deps.ts";
import { symbols } from "./symbols.ts";
import { VERSION } from "../version.ts";

const REMOTE_URL =
  `https://github.com/Symbitic/deno-webbluetooth/releases/download/v${VERSION}`;
const LOCAL_URL = Deno.build.os === "windows"
  ? "build/bin/Release"
  : "build/bin";

const { protocol } = new URL(import.meta.url);

const libDir = protocol === "file:" ? LOCAL_URL : REMOTE_URL;
//const envPath = Deno.env.get("DENO_SIMPLEBLE_PATH");

const options: Plug.Options = {
  name: "simpleble",
  policy: protocol === "file:" ? Plug.CachePolicy.NONE : Plug.CachePolicy.STORE,
  urls: {
    darwin: `${libDir}/libsimpleble-c.dylib`,
    windows: `${libDir}/simpleble-c.dll`,
    linux: `${libDir}/libsimpleble-c.so`,
  },
};

const UUID_STRUCT_SIZE = 37;
const SERVICE_STRUCT_SIZE = 640;
const MANUFACTURER_SIZE = 40;

export type Adapter = bigint;
export type Peripheral = bigint;
export type Characteristic = bigint;
export type UserData = bigint | null; // void*

/** Bluetooth service. */
export interface Service {
  uuid: string;
  characteristics: string[];
}

/** Bluetooth manufacturer data. */
export interface ManufacturerData {
  id: number;
  data: Uint8Array;
}

export type OnScanStart = (
  adapter: Adapter,
  userdata: UserData,
) => void;
export type OnScanStop = (adapter: Adapter, userdata: UserData) => void;
export type OnScanUpdated = (
  adapter: Adapter,
  peripheral: Peripheral,
  userdata: UserData,
) => void;
export type OnScanFound = (
  adapter: Adapter,
  peripheral: Peripheral,
  userdata: UserData,
) => void;
export type OnNotify = (
  service: string,
  characteristic: string,
  data: Uint8Array,
  userdata: UserData,
) => void;
export type OnIndicate = (
  service: string,
  characteristic: string,
  data: Uint8Array,
  userdata: UserData,
) => void;
export type OnConnected = (
  peripheral: Peripheral,
  userdata: UserData,
) => void;
export type OnDisconnected = (
  peripheral: Peripheral,
  userdata: UserData,
) => void;

function encodeString(str: string, bufSize = 0): Uint8Array {
  const encoder = new TextEncoder();
  const src = encoder.encode(str);
  const dst = new ArrayBuffer(bufSize > 0 ? bufSize : str.length);
  const ret = new Uint8Array(dst);
  ret.set(new Uint8Array(src));
  return ret;
}

let lib: Deno.DynamicLibrary<typeof symbols>;

const MINIMUM_DENO_VERSION = "1.23.0";
const [major, minor, _patch] = Deno.version.deno.split(".");
const [minMajor, minMinor, _minPatch] = MINIMUM_DENO_VERSION.split(".");

if (major < minMajor || (major === minMajor && minor < minMinor)) {
  throw new Error(
    `Please upgrade to Deno version ${MINIMUM_DENO_VERSION} or later`,
  );
}

try {
  lib = await Plug.prepare(options, symbols);
} catch (e) {
  if (e instanceof Deno.errors.PermissionDenied) {
    throw e;
  }

  const error = new Error(
    "SimpleBLE not found. Either build it or set the `DENO_SIMPLEBLE_PATH` environment variable.",
  );
  error.cause = e;
  throw error;
}

export function simpleble_adapter_get_count(): bigint {
  return lib.symbols.simpleble_adapter_get_count();
}
export function simpleble_adapter_get_handle(index: number): Adapter {
  return lib.symbols.simpleble_adapter_get_handle(index);
}
export function simpleble_adapter_release_handle(handle: Adapter): void {
  lib.symbols.simpleble_adapter_release_handle(handle);
}
export function simpleble_adapter_identifier(handle: Adapter): string {
  const ptr = lib.symbols.simpleble_adapter_identifier(handle);
  const view = new Deno.UnsafePointerView(ptr);
  const cstr = view.getCString();
  simpleble_free(ptr);
  return cstr;
}
export function simpleble_adapter_address(handle: Adapter): string {
  const ret = lib.symbols.simpleble_adapter_address(handle);
  const view = new Deno.UnsafePointerView(ret);
  const cstr = view.getCString();
  simpleble_free(ret);
  return cstr;
}
export function simpleble_adapter_scan_start(handle: Adapter): boolean {
  const ret = lib.symbols.simpleble_adapter_scan_start(handle);
  return ret > 0 ? false : true;
}
export function simpleble_adapter_scan_stop(handle: Adapter): boolean {
  const ret = lib.symbols.simpleble_adapter_scan_stop(handle);
  return ret > 0 ? false : true;
}
export function simpleble_adapter_scan_is_active(handle: Adapter): boolean {
  const isActive = new Uint8Array(1);
  const ret = lib.symbols.simpleble_adapter_scan_is_active(handle, isActive);
  if (ret > 0) {
    return false;
  }
  const active = isActive[0];
  return Boolean(active);
}
export function simpleble_adapter_scan_get_results_count(
  handle: Adapter,
): bigint {
  return lib.symbols.simpleble_adapter_scan_get_results_count(handle);
}
export function simpleble_adapter_scan_get_results_handle(
  handle: Adapter,
  index: number,
): Peripheral {
  return lib.symbols.simpleble_adapter_scan_get_results_handle(handle, index);
}
export function simpleble_adapter_get_paired_peripherals_count(
  handle: Adapter,
): bigint {
  return lib.symbols.simpleble_adapter_get_paired_peripherals_count(handle);
}
export function simpleble_adapter_get_paired_peripherals_handle(
  handle: Adapter,
  index: number,
): Peripheral {
  return lib.symbols.simpleble_adapter_get_paired_peripherals_handle(
    handle,
    index,
  );
}
export function simpleble_peripheral_release_handle(handle: Peripheral): void {
  lib.symbols.simpleble_peripheral_release_handle(handle);
}
export function simpleble_peripheral_identifier(handle: Peripheral): string {
  const ret = lib.symbols.simpleble_peripheral_identifier(handle);
  const view = new Deno.UnsafePointerView(ret);
  const cstr = view.getCString();
  simpleble_free(ret);
  return cstr;
}
export function simpleble_peripheral_address(handle: Peripheral): string {
  const ret = lib.symbols.simpleble_peripheral_address(handle);
  const view = new Deno.UnsafePointerView(ret);
  const cstr = view.getCString();
  simpleble_free(ret);
  return cstr;
}
export function simpleble_peripheral_rssi(handle: Peripheral): number {
  return lib.symbols.simpleble_peripheral_rssi(handle);
}
export function simpleble_peripheral_connect(handle: Peripheral): boolean {
  const ret = lib.symbols.simpleble_peripheral_connect(handle);
  return ret > 0 ? false : true;
}
export function simpleble_peripheral_disconnect(handle: Peripheral): boolean {
  const ret = lib.symbols.simpleble_peripheral_disconnect(handle);
  return ret > 0 ? false : true;
}
export function simpleble_peripheral_is_connected(handle: Peripheral): boolean {
  const result = new Uint8Array(1);
  const ret = lib.symbols.simpleble_peripheral_is_connected(handle, result);
  return ret === 0 && Boolean(result[0]);
}
export function simpleble_peripheral_is_connectable(
  handle: Peripheral,
): boolean {
  const result = new Uint8Array(1);
  const ret = lib.symbols.simpleble_peripheral_is_connectable(handle, result);
  return ret === 0 && Boolean(result[0]);
}
export function simpleble_peripheral_is_paired(handle: Peripheral): boolean {
  const result = new Uint8Array(1);
  const ret = lib.symbols.simpleble_peripheral_is_paired(handle, result);
  return ret === 0 && Boolean(result[0]);
}
export function simpleble_peripheral_unpair(handle: Peripheral): boolean {
  const ret = lib.symbols.simpleble_peripheral_unpair(handle);
  return ret > 0 ? false : true;
}
export function simpleble_peripheral_services_count(
  handle: Peripheral,
): bigint {
  return lib.symbols.simpleble_peripheral_services_count(handle);
}

export function simpleble_peripheral_services_get(
  handle: Peripheral,
  index: number,
): Service {
  const CHARCOUNT_OFFSET = 40;
  const CHARS_OFFSET = 48;

  const decoder = new TextDecoder();
  const u8 = new Uint8Array(SERVICE_STRUCT_SIZE);
  const ptr = Deno.UnsafePointer.of(u8);
  const err = lib.symbols.simpleble_peripheral_services_get(handle, index, ptr);
  if (err !== 0) {
    return {
      uuid: "",
      characteristics: [],
    };
  }
  const uuidArray = new Uint8Array(UUID_STRUCT_SIZE - 1);
  const view = new Deno.UnsafePointerView(ptr);
  const characteristics: string[] = [];

  view.copyInto(uuidArray, 0);
  const charsCount = view.getBigUint64(CHARCOUNT_OFFSET);
  const INCREMENT = CHARCOUNT_OFFSET; // Might be CHARCOUNT_OFFSET or UUID_STRUCT_SIZE
  for (let i = 0; i < charsCount; i++) {
    const charArray = new Uint8Array(UUID_STRUCT_SIZE - 1);
    const offset = CHARS_OFFSET + (i * INCREMENT);
    view.copyInto(charArray, offset);
    const char = decoder.decode(charArray);
    characteristics.push(char);
  }
  const uuid = decoder.decode(uuidArray);

  return { uuid, characteristics };
}

export function simpleble_peripheral_manufacturer_data_count(
  handle: Peripheral,
): bigint {
  return lib.symbols.simpleble_peripheral_manufacturer_data_count(handle);
}

export function simpleble_peripheral_manufacturer_data_get(
  handle: Peripheral,
  index: number,
): ManufacturerData | undefined {
  const struct = new Uint8Array(MANUFACTURER_SIZE + 1);
  const view = new DataView(struct.buffer);

  const err = lib.symbols.simpleble_peripheral_manufacturer_data_get(
    handle,
    index,
    struct,
  );
  if (err !== 0) return undefined;

  const id = view.getUint16(0, true);
  const dataLength = Number(view.getBigUint64(8, true));
  if (dataLength > 24) {
    //throw new Error("Invalid data length");
  }

  const data = dataLength > 0
    ? struct.slice(16, 16 + dataLength)
    : new Uint8Array(0);

  return { id, data };
}

export function simpleble_peripheral_read(
  handle: Peripheral,
  service: string,
  characteristic: string,
): Uint8Array | undefined {
  const serviceBuf = encodeString(service, UUID_STRUCT_SIZE);
  const charBuf = encodeString(characteristic, UUID_STRUCT_SIZE);
  const dataPtr = new BigUint64Array(1);
  const lengthPtr = new BigUint64Array(1);

  const err = lib.symbols.simpleble_peripheral_read(
    handle,
    serviceBuf,
    charBuf,
    dataPtr,
    lengthPtr,
  );
  if (err !== 0) return undefined;

  const dataView = new Deno.UnsafePointerView(dataPtr[0]);
  const lengthView = new Deno.UnsafePointerView(lengthPtr[0]);

  const dataLength = Number(lengthView.getBigUint64());
  const data = new Uint8Array(dataLength);
  dataView.copyInto(data);

  return data;
}

export function simpleble_peripheral_write_request(
  handle: Peripheral,
  service: string,
  characteristic: string,
  data: Uint8Array,
): boolean {
  const serviceBuf = encodeString(service, UUID_STRUCT_SIZE);
  const charBuf = encodeString(characteristic, UUID_STRUCT_SIZE);

  const err = lib.symbols.simpleble_peripheral_write_request(
    handle,
    serviceBuf,
    charBuf,
    data,
    data.length,
  );
  if (err !== 0) return false;

  return true;
}

export function simpleble_peripheral_write_command(
  handle: Peripheral,
  service: string,
  characteristic: string,
  data: Uint8Array,
): boolean {
  const serviceBuf = encodeString(service, UUID_STRUCT_SIZE);
  const charBuf = encodeString(characteristic, UUID_STRUCT_SIZE);

  const err = lib.symbols.simpleble_peripheral_write_command(
    handle,
    serviceBuf,
    charBuf,
    data,
    data.length,
  );
  if (err !== 0) return false;

  return true;
}

export function simpleble_peripheral_unsubscribe(
  handle: Peripheral,
  service: string,
  characteristic: string,
): boolean {
  const serviceBuf = encodeString(service, UUID_STRUCT_SIZE);
  const charBuf = encodeString(characteristic, UUID_STRUCT_SIZE);

  const err = lib.symbols.simpleble_peripheral_unsubscribe(
    handle,
    serviceBuf,
    charBuf,
  );
  if (err !== 0) return false;

  return true;
}

export function simpleble_free(handle: bigint): void {
  lib.symbols.simpleble_free(handle);
}

////////////////////////////////////////////////////////////////////////////////

export function simpleble_adapter_set_callback_on_scan_found(
  handle: Adapter,
  cb: OnScanFound,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer", "pointer"],
      result: "void",
    },
    (handlePtr: bigint, peripheralPtr: bigint, userdataPtr: bigint) => {
      cb(handlePtr, peripheralPtr, userdataPtr);
    },
  );
  const ret = lib.symbols.simpleble_adapter_set_callback_on_scan_found(
    handle,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}

export function simpleble_adapter_set_callback_on_scan_start(
  handle: Adapter,
  cb: OnScanStart,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer"],
      result: "void",
    },
    (handlePtr: bigint, userdataPtr: bigint) => {
      cb(handlePtr, userdataPtr);
    },
  );
  const ret = lib.symbols.simpleble_adapter_set_callback_on_scan_start(
    handle,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}

export function simpleble_adapter_set_callback_on_scan_stop(
  handle: Adapter,
  cb: OnScanStop,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer"],
      result: "void",
    },
    (handlePtr: bigint, userdataPtr: bigint) => {
      cb(handlePtr, userdataPtr);
    },
  );
  const ret = lib.symbols.simpleble_adapter_set_callback_on_scan_stop(
    handle,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}
export function simpleble_adapter_set_callback_on_scan_updated(
  handle: Adapter,
  cb: OnScanUpdated,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer", "pointer"],
      result: "void",
    },
    (handlePtr: bigint, peripheralPtr: bigint, userdataPtr: bigint) => {
      cb(handlePtr, peripheralPtr, userdataPtr);
    },
  );
  const ret = lib.symbols.simpleble_adapter_set_callback_on_scan_updated(
    handle,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}

export function simpleble_peripheral_indicate(
  handle: Peripheral,
  service: string,
  characteristic: string,
  cb: OnIndicate,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer", "pointer", "usize", "pointer"],
      result: "void",
    },
    (
      servicePtr: bigint,
      charPtr: bigint,
      dataPtr: bigint,
      dataSize: bigint,
      userdataPtr: bigint,
    ) => {
      const service = new Deno.UnsafePointerView(servicePtr).getCString();
      const char = new Deno.UnsafePointerView(charPtr).getCString();
      const data = new Uint8Array(Number(dataSize));
      const dataView = new Deno.UnsafePointerView(dataPtr);
      dataView.copyInto(data);
      cb(service, char, data, userdataPtr);
    },
  );
  const serviceBuf = encodeString(service, UUID_STRUCT_SIZE);
  const charBuf = encodeString(characteristic, UUID_STRUCT_SIZE);
  const ret = lib.symbols.simpleble_peripheral_indicate(
    handle,
    serviceBuf,
    charBuf,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}

export function simpleble_peripheral_notify(
  handle: Peripheral,
  service: string,
  characteristic: string,
  cb: OnNotify,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer", "pointer", "usize", "pointer"],
      result: "void",
    },
    (
      servicePtr: bigint,
      charPtr: bigint,
      dataPtr: bigint,
      dataSize: bigint,
      userdataPtr: bigint,
    ) => {
      const service = new Deno.UnsafePointerView(servicePtr).getCString();
      const char = new Deno.UnsafePointerView(charPtr).getCString();
      const data = new Uint8Array(Number(dataSize));
      const dataView = new Deno.UnsafePointerView(dataPtr);
      dataView.copyInto(data);
      cb(service, char, data, userdataPtr);
    },
  );
  const serviceBuf = encodeString(service, UUID_STRUCT_SIZE);
  const charBuf = encodeString(characteristic, UUID_STRUCT_SIZE);
  const ret = lib.symbols.simpleble_peripheral_notify(
    handle,
    serviceBuf,
    charBuf,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}
export function simpleble_peripheral_set_callback_on_connected(
  handle: Peripheral,
  cb: OnConnected,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer"],
      result: "void",
    },
    (handlePtr: bigint, userdataPtr: bigint) => {
      cb(handlePtr, userdataPtr);
    },
  );
  const ret = lib.symbols.simpleble_peripheral_set_callback_on_connected(
    handle,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}
export function simpleble_peripheral_set_callback_on_disconnected(
  handle: Peripheral,
  cb: OnDisconnected,
  userdata: UserData = null,
): boolean {
  const cbResource = new Deno.UnsafeCallback(
    {
      parameters: ["pointer", "pointer"],
      result: "void",
    },
    (handlePtr: bigint, userdataPtr: bigint) => {
      cb(handlePtr, userdataPtr);
    },
  );
  const ret = lib.symbols.simpleble_peripheral_set_callback_on_disconnected(
    handle,
    cbResource.pointer,
    userdata,
  );
  return ret > 0 ? false : true;
}
