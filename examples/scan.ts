import { Bluetooth } from "../mod.ts";
import type { RequestDeviceInfo } from "../mod.ts";

// Scan for a LEGO Hub.
const DEVICE_NAME = "HUB";
const SERVICE_UUID = "00001623-1212-efde-1623-785feabcd123";
const CHARACTERISTIC_UUID = "00001624-1212-efde-1623-785feabcd123";

const bluetooth = new Bluetooth();

const isAvailable = await bluetooth.getAvailability();
if (!isAvailable) {
  console.error("No adapters found!");
  Deno.exit(1);
}

function deviceFilter(deviceInfo: RequestDeviceInfo): boolean {
  if (deviceInfo.id.includes(DEVICE_NAME)) {
    console.log("Found");
    return true;
  }
  return false;
}

try {
  const device = await bluetooth.requestDevice({ deviceFound: deviceFilter });
  const server = await device.gatt.connect();

  const service = await server.getPrimaryService(SERVICE_UUID);
  console.log(`Service UUID: ${service.uuid}`);

  const char = await service.getCharacteristic(CHARACTERISTIC_UUID);
  console.log(`Characteristic UUID: ${char.uuid}`);

  server.disconnect();
} catch (err) {
  console.error(err);
  Deno.exit(1);
}
