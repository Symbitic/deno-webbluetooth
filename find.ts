import * as glob from "https://esm.sh/glob@8.0.3";
import { statSync } from "https://deno.land/std@0.153.0/node/fs.ts";

export const paths = (patterns: string[]): string[] => {
  return patterns.reduce((acc: string[], pattern: string): string[] => {
    return acc.concat(
      glob.sync(pattern).filter((path) => statSync(path).isFile()),
    );
  }, []);
};

export const parseInputFiles = (files: string): string[] => {
  return files.split(/\r?\n/).reduce<string[]>(
    (acc, line) =>
      acc
        .concat(line.split(","))
        .filter((pat) => pat)
        .map((pat) => pat.trim()),
    [],
  );
};

if (Deno.build.os === "darwin") {
  const a = parseInputFiles("./**/*.dylib");
  console.log(a);
  const b = paths(a);
  console.log(b);
} else if (Deno.build.os === "windows") {
  const a = parseInputFiles("./**/*.dll");
  console.log(a);
  const b = paths(a);
  console.log(b);
} else {
  const a = parseInputFiles("./**/*.so");
  console.log(a);
  const b = paths(a);
  console.log(b);
}
