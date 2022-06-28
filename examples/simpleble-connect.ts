import { delay } from "../deps.ts";
import {
  simpleble_adapter_get_count,
  simpleble_adapter_get_handle,
  simpleble_adapter_scan_get_results_count,
  simpleble_adapter_scan_get_results_handle,
  simpleble_adapter_scan_start,
  simpleble_adapter_scan_stop,
  simpleble_peripheral_address,
  simpleble_peripheral_connect,
  simpleble_peripheral_disconnect,
  simpleble_peripheral_identifier,
  simpleble_peripheral_release_handle,
  simpleble_peripheral_services_count,
  simpleble_peripheral_services_get,
} from "../src/ffi.ts";

const DELAY = 2000;

const adaptersCount = simpleble_adapter_get_count();
if (adaptersCount === 0n) {
  console.error("No Bluetooth adapters found");
  Deno.exit(1);
}

console.log(`Found ${adaptersCount} adapters`);
const adapter = simpleble_adapter_get_handle(0);

console.log(`Starting scan`);
simpleble_adapter_scan_start(adapter);
await delay(DELAY);
simpleble_adapter_scan_stop(adapter);
console.log(`Finished scan`);

const resultsCount = simpleble_adapter_scan_get_results_count(adapter);
if (resultsCount === 0n) {
  console.error("No devices found");
  Deno.exit(1);
}
console.log(`Found ${resultsCount} devices`);

for (let i = 0; i < resultsCount; i++) {
  const d = simpleble_adapter_scan_get_results_handle(adapter, i);
  const id = simpleble_peripheral_identifier(d);
  const address = simpleble_peripheral_address(d);
  const str = id.length > 0 ? `${id} [${address}]` : `[${address}]`;
  console.log(`[${i}] - ${str}`);
  simpleble_peripheral_release_handle(d);
}

const inputString = prompt("Please select a device to connect to:");
const input = parseInt(inputString || "", 10);
if (isNaN(input) || input < 0 || input >= resultsCount) {
  console.error("Invalid device selected");
  Deno.exit(1);
}

const device = simpleble_adapter_scan_get_results_handle(adapter, input);
const connected = simpleble_peripheral_connect(device);
if (!connected) {
  console.error("Failed to connect");
  simpleble_peripheral_release_handle(device);
  Deno.exit(1);
}

const servicesCount = simpleble_peripheral_services_count(device);
console.log(`Found ${servicesCount} services`);
for (let i = 0; i < servicesCount; i++) {
  const service = simpleble_peripheral_services_get(device, i);
  console.log(`[${i}] - ${service.uuid}`);
}
const serviceString = prompt("Please select a service:");
const serviceNum = parseInt(serviceString || "", 10);
if (isNaN(serviceNum) || serviceNum < 0 || serviceNum >= servicesCount) {
  console.error("Invalid service selected");
  simpleble_peripheral_disconnect(device);
  simpleble_peripheral_release_handle(device);
  Deno.exit(1);
}
const service = simpleble_peripheral_services_get(device, serviceNum);

const charsCount = service.characteristics.length;
console.log(`Found ${charsCount} characteristics`);
for (let i = 0; i < charsCount; i++) {
  console.log(`[${i}] ${service.characteristics[i]}`);
}

simpleble_peripheral_disconnect(device);
simpleble_peripheral_release_handle(device);
