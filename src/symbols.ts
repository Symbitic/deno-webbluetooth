export const symbols = {
  simpleble_adapter_get_count: {
    parameters: [],
    result: "usize",
  },
  simpleble_adapter_get_handle: {
    parameters: ["usize"],
    result: "pointer",
  },
  simpleble_adapter_release_handle: {
    parameters: ["pointer"],
    result: "void",
  },
  simpleble_adapter_identifier: {
    parameters: ["pointer"],
    result: "pointer",
  },
  simpleble_adapter_address: {
    parameters: ["pointer"],
    result: "pointer",
  },
  simpleble_adapter_scan_start: {
    parameters: ["pointer"],
    result: "u32",
  },
  simpleble_adapter_scan_stop: {
    parameters: ["pointer"],
    result: "u32",
  },
  simpleble_adapter_scan_is_active: {
    parameters: ["pointer", "pointer"],
    result: "u32",
  },
  simpleble_adapter_scan_get_results_count: {
    parameters: ["pointer"],
    result: "usize",
  },
  simpleble_adapter_scan_get_results_handle: {
    parameters: ["pointer", "usize"],
    result: "pointer",
  },
  simpleble_adapter_set_callback_on_scan_found: {
    parameters: ["pointer", "function", "pointer"],
    result: "u32",
  },
  simpleble_adapter_set_callback_on_scan_start: {
    parameters: ["pointer", "function", "pointer"],
    result: "u32",
  },
  simpleble_adapter_set_callback_on_scan_stop: {
    parameters: ["pointer", "function", "pointer"],
    result: "u32",
  },
  simpleble_adapter_set_callback_on_scan_updated: {
    parameters: ["pointer", "function", "pointer"],
    result: "u32",
  },
  simpleble_adapter_get_paired_peripherals_count: {
    parameters: ["pointer"],
    result: "usize",
  },
  simpleble_adapter_get_paired_peripherals_handle: {
    parameters: ["pointer", "usize"],
    result: "pointer",
  },
  simpleble_peripheral_release_handle: {
    parameters: ["pointer"],
    result: "void",
  },
  simpleble_peripheral_identifier: {
    parameters: ["pointer"],
    result: "pointer",
  },
  simpleble_peripheral_address: {
    parameters: ["pointer"],
    result: "pointer",
  },
  simpleble_peripheral_rssi: {
    parameters: ["pointer"],
    result: "i16",
  },
  simpleble_peripheral_connect: {
    parameters: ["pointer"],
    result: "u32",
  },
  simpleble_peripheral_disconnect: {
    parameters: ["pointer"],
    result: "u32",
  },
  simpleble_peripheral_indicate: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "pointer", // simpleble_uuid_t service
      "pointer", // simpleble_uuid_t characteristic
      "function", // ["pointer", "pointer", "pointer", "usize", "pointer"]
      "pointer", // void* userdata
    ],
    result: "u32",
  },
  simpleble_peripheral_is_connected: {
    parameters: ["pointer", "pointer"],
    result: "u32",
  },
  simpleble_peripheral_is_connectable: {
    parameters: ["pointer", "pointer"],
    result: "u32",
  },
  simpleble_peripheral_is_paired: {
    parameters: ["pointer", "pointer"],
    result: "u32",
  },
  simpleble_peripheral_unpair: {
    parameters: ["pointer"],
    result: "u32",
  },
  simpleble_peripheral_services_count: {
    parameters: ["pointer"],
    result: "usize",
  },
  simpleble_peripheral_services_get: {
    parameters: ["pointer", "usize", "pointer"],
    result: "u32",
  },
  simpleble_peripheral_manufacturer_data_count: {
    parameters: ["pointer"],
    result: "usize",
  },
  simpleble_peripheral_manufacturer_data_get: {
    parameters: ["pointer", "usize", "pointer"],
    result: "u32",
  },
  simpleble_peripheral_notify: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "pointer", // simpleble_uuid_t service
      "pointer", // simpleble_uuid_t characteristic
      "function", // ["pointer", "pointer", "pointer", "usize", "pointer"]
      "pointer", // void* userdata
    ],
    result: "u32",
  },
  simpleble_peripheral_read: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "pointer", // simpleble_uuid_t service
      "pointer", // simpleble_uuid_t characteristic
      "pointer", // uint8_t** data
      "pointer", // size_t* data_length
    ],
    result: "u32",
  },
  simpleble_peripheral_set_callback_on_connected: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "function", // ["pointer", "pointer"]
      "pointer", // void* userdata
    ],
    result: "u32",
  },
  simpleble_peripheral_set_callback_on_disconnected: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "function", // ["pointer", "pointer"]
      "pointer", // void* userdata
    ],
    result: "u32",
  },
  simpleble_peripheral_write_request: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "pointer", // simpleble_uuid_t service
      "pointer", // simpleble_uuid_t characteristic
      "pointer", // uint8_t* data
      "usize", // size_t data_length
    ],
    result: "u32",
  },
  simpleble_peripheral_write_command: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "pointer", // simpleble_uuid_t service
      "pointer", // simpleble_uuid_t characteristic
      "pointer", // uint8_t* data
      "usize", // size_t data_length
    ],
    result: "u32",
  },
  simpleble_peripheral_unsubscribe: {
    parameters: [
      "pointer", // simpleble_peripheral_t handle
      "pointer", // simpleble_uuid_t service
      "pointer", // simpleble_uuid_t characteristic
    ],
    result: "u32",
  },
  simpleble_free: {
    parameters: ["pointer"],
    result: "void",
  },
} as const;
