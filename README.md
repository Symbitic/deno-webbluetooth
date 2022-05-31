# Deno-WebBluetooth

WebBluetooth wrapper for Deno using the excellent
[SimpleBLE](https://github.com/OpenBluetoothToolbox/SimpleBLE) library.

**This is not yet complete or compliant with the WebBluetooth standard.**

## Building

To build SimpleBLE, run:

    deno run -A --unstable ./build.ts

## Running

After building SimpleBLE, run one of the examples:

    deno run -A --unstable ./examples/simpleble-scan.ts

## License

Released under the [MIT License](LICENSE).
