import { bold, red, which } from "./deps_dev.ts";

const SOURCE_DIR = "SimpleBLE";
const BUILD_DIR = "build";
const BIN_DIR = `${BUILD_DIR}/bin`;
const CMAKELISTS_FILE = `${SOURCE_DIR}/CMakeLists.txt`;
const TARGET_NAME = "simpleble-c";
const WINDOWS_NAME = "libsimpleble-c.dylib";
const MACOS_NAME = "simpleble-c.dll";

// Respects CMAKE_PATH, GIT_PATH, etc.
async function find(program: string): Promise<string> {
  const pathName = `${program.toUpperCase()}_PATH`;

  let exe = Deno.env.get(pathName);
  if (exe === undefined) {
    exe = await which(program);
  }
  if (exe === undefined) {
    console.error(
      bold(
        red(
          `${program} not found. Please either install it or set the \`${pathName}\` environment variable.`,
        ),
      ),
    );
    Deno.exit(1);
  }

  return exe;
}

export async function checkout(gitExe: string): Promise<void> {
  try {
    const file = await Deno.open(CMAKELISTS_FILE);
    Deno.close(file.rid);
    // Submodules found. No more work.
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  for (const cmd of ["init", "update"]) {
    const p = Deno.run({
      cmd: [gitExe, "submodule", cmd],
    });
    const status = await p.status();
    p.close();
    if (!status.success) {
      console.error(bold(red(`\`git submodule ${cmd}\` failed.`)));
      Deno.exit(1);
    }
  }
}

async function configure(cmakeExe: string): Promise<void> {
  const args = [
    "-B",
    BUILD_DIR,
    "-S",
    SOURCE_DIR,
  ];
  switch (Deno.build.os) {
    case "darwin":
      args.push("-DCMAKE_CONFIGURATION_TYPES=Release");
      args.push("-DCMAKE_OSX_DEPLOYMENT_TARGET=10.15");
      break;
    case "linux":
      args.push("-DCMAKE_BUILD_TYPE=Release");
      args.push("-G");
      args.push(await which("ninja") ? "Ninja" : "Unix Makefiles");
      break;
    case "windows":
      args.push("-DCMAKE_CONFIGURATION_TYPES=Release");
      args.push("-DCMAKE_OSX_DEPLOYMENT_TARGET=10.15");
      args.push('-DCMAKE_SYSTEM_VERSION="10.0.22000.0"');
      args.push("-A");
      args.push(Deno.build.arch === "aarch64" ? "ARM64" : "X64");
      break;
  }
  const p = Deno.run({
    cmd: [cmakeExe, ...args],
  });
  const status = await p.status();
  p.close();
  if (!status.success) {
    console.error(bold(red(`Error configuring CMake.`)));
    Deno.exit(1);
  }
}

async function build(cmakeExe: string): Promise<void> {
  const p = Deno.run({
    cmd: [
      cmakeExe,
      "--build",
      BUILD_DIR,
      "--config",
      "Release",
      "--target",
      TARGET_NAME,
    ],
  });
  const status = await p.status();
  p.close();
  if (!status.success) {
    console.error(bold(red(`Error building CMake.`)));
    Deno.exit(1);
  }
}

async function postbuild(): Promise<void> {
  if (Deno.build.os === "linux") {
    return;
  }
  const filename = Deno.build.os === "windows" ? WINDOWS_NAME : MACOS_NAME;
  const fromPath = `${BIN_DIR}/Release/${filename}`;
  const toPath = `${BIN_DIR}/${filename}`;
  await Deno.copyFile(fromPath, toPath);
}

const cmake = await find("cmake");
const git = await find("git");

await checkout(git);
await configure(cmake);
await build(cmake);
await postbuild();
