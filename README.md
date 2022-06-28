# Deno-WebBluetooth

WebBluetooth wrapper for Deno using the excellent
[SimpleBLE](https://github.com/OpenBluetoothToolbox/SimpleBLE) library.

**This is not yet complete or compliant with the WebBluetooth standard.**

## Building

Before building SimpleBLE, make sure the submodules are checked out.

    git submodule init
    git submodule update

To build SimpleBLE, first run the appropriate configure script:

    deno task configure-linux
    # OR
    deno task configure-macos
    # OR
    deno task configure-windows

After that, build SimpleBLE:

    deno task build

## Running

After building SimpleBLE, run one of the examples:

    deno run -A --unstable ./examples/simpleble-scan.ts

## License

Released under the [MIT License](LICENSE).
