import { Bluetooth } from "../mod.ts";
import type { RequestDeviceInfo } from "../mod.ts";

// CHANGE THIS!
const DEVICE_NAME = "HUB";

function deviceFilter(deviceInfo: RequestDeviceInfo): boolean {
  if (deviceInfo.name.includes(DEVICE_NAME)) {
    return true;
  }
  return false;
}

const bluetooth = new Bluetooth();

const isAvailable = await bluetooth.getAvailability();
if (!isAvailable) {
  console.error("No adapters found!");
  Deno.exit(1);
}

try {
  console.log(`Scanning for "${DEVICE_NAME}"`);
  const device = await bluetooth.requestDevice({
    filter: deviceFilter,
  });

  console.log(`Found!`);
  const server = await device.gatt.connect();

  const services = await server.getPrimaryServices();
  for (const service of services) {
    console.log(`Service: ${service.uuid}`);
    const characteristics = await service.getCharacteristics();
    for (const characteristic of characteristics) {
      console.log(`  Characteristic: ${characteristic.uuid}`);
      const descriptors = await characteristic.getDescriptors();
      for (const descriptor of descriptors) {
        console.log(`    Descriptor: ${descriptor.uuid}`);
      }
    }
  }

  console.log("Disconnecting");
  server.disconnect();
} catch (err) {
  console.error(err.message);
  Deno.exit(1);
}
