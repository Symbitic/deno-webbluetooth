# Deno-WebBluetooth

[![documentation](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://deno.land/x/webbluetooth/mod.ts)

WebBluetooth wrapper for Deno using the excellent
[SimpleBLE](https://github.com/OpenBluetoothToolbox/SimpleBLE) library.

## Status

Most of the WebBluetooth standard is working, except for descriptors.

Some things are not compatible with the WebBluetooth standard, particularly
`requestDevice`. The standard calls for the user to select a device manually,
which is not possible here. Instead, callbacks are used to select which
device(s) to connect to.

This adds a `bluetooth.requestDevices()` method to return multiple devices, and
a `bluetooth.scan()` method that returns an `AsyncIterableIterator`.

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
