import { Bluetooth } from "../mod.ts";
import { delay } from "../deps.ts";
import type { RequestDeviceInfo } from "../mod.ts";

const DISCONNECT_TIMEOUT = 5000;

const DEVICE_NAME = prompt("Please enter a device name:")!;
if (!DEVICE_NAME) {
  console.error("Invalid device name");
  Deno.exit(1);
}

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

  console.log("Found");
  const server = await device.gatt.connect();
  console.log("Connected");

  const services = await server.getPrimaryServices();

  console.log("Services:");
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    console.log(`${i}: ${service.uuid}`);
  }

  const serviceString = prompt("Please select a service:");
  const serviceNum = parseInt(serviceString || "", 10);
  if (isNaN(serviceNum) || serviceNum < 0 || serviceNum >= services.length) {
    console.error("Invalid service selected");
    Deno.exit(1);
  }

  const service = services[serviceNum];
  const characteristics = await service.getCharacteristics();

  console.log("Characteristics:");
  for (let i = 0; i < characteristics.length; i++) {
    const characteristic = characteristics[i];
    console.log(`${i}: ${characteristic.uuid}`);
  }

  const characteristicString = prompt("Please select a characteristic:");
  const characteristicNum = parseInt(characteristicString || "", 10);
  if (
    isNaN(characteristicNum) || characteristicNum < 0 ||
    characteristicNum >= characteristics.length
  ) {
    console.error("Invalid characteristic selected");
    Deno.exit(1);
  }

  const characteristic = characteristics[characteristicNum];

  characteristic.addEventListener("notify", () => {
    console.log("NOTIFY");
  });
  characteristic.addEventListener("indicate", () => {
    console.log("INDICATE");
  });

  console.log("Starting notifications");
  await characteristic.startNotifications();

  await delay(DISCONNECT_TIMEOUT);

  console.log("Disconnecting");
  server.disconnect();
} catch (err) {
  console.error(err.message);
  Deno.exit(1);
}
