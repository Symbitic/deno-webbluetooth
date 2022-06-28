import { delay } from "../deps.ts";
import {
  simpleble_adapter_get_count,
  simpleble_adapter_get_handle,
  simpleble_adapter_scan_get_results_count,
  simpleble_adapter_scan_get_results_handle,
  simpleble_adapter_scan_start,
  simpleble_adapter_scan_stop,
  simpleble_peripheral_address,
  simpleble_peripheral_identifier,
  simpleble_peripheral_release_handle,
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
