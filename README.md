# rollup-plugin-comlink

Use workers seamlessly

Workers are JavaScript’s version of threads. [Workers are important to use][when workers] as the main thread is already overloaded, especially on slower or older devices.

[`@surma/rollup-plugin-off-main-thread`][omt plugin] teaches Rollup about Workers. This plugin makes their use seamless using [Comlink].

## Usage

To avoid having to make new releases of this plugin with every release of [Comlink] or my [OMT plugin], both of these modules have been declared as peer dependencies. This means you will have to explicitely add them to your dependency list:

```
$ npm install --save @surma/rollup-plugin-comlink @surma/rollup-plugin-off-main-thread comlink
```

### Config

```js
// rollup.config.js
import comlink from "@surma/rollup-plugin-comlink";
import omt from "@surma/rollup-plugin-off-main-thread";

export default {
  input: ["src/main.js"],
  output: {
    dir: "dist",
    // You _must_ use either “amd” or “esm” as your format.
    // But note that only very few browsers have native support for
    // modules in workers.
    format: "amd",
  },
  plugins: [comlink(), omt()],
};
```

### Example

```js
// worker.js
export function doMath(a, b) {
  return a + b;
}
```

> **Note:** Importing individual exports currently does _not_ work. `comlink:` modules only have one default export.

```js
// main.js

import workerAPI from "comlink:./worker.js";

(async function () {
  const result = await workerAPI.doMath(40, 2);
  console.assert(result == 42);
})();
```

### Options

```js
{
  // ...
  plugins: [comlink(options), omt()];
}
```

- `marker`: A string that is used as a prefix to mark a worker import. Default is `comlink`.
- `useModuleWorkers`: Use module workers (requires `{format: "esm"}`).
- `autoWrap`: A list of regex. Modules whose id matches the regex will be wrapped by comlink automatically.

## TypeScript

TypeScript can be taught to handle these pseudo-imports correctly and forward the types appropriately.

```ts
// main.ts
import workerAPI from "comlink:./worker.js";

console.log(await workerAPI.sayHello("surma"));
// This would fail to compile:
// console.log(await workerAPI.doesNotExit("surma"));
```

```ts
// worker.ts
export function sayHello(name: string): string {
  return `Hello ${name}!`;
}
```

```ts
// worker-modules.d.ts
declare module "comlink:./worker.js" {
  // Do *not* move this to a top-level import, as it will turn this
  // .d.ts file from an ambient module into a local module.
  const wrap: import("comlink").Remote<typeof import("./worker.js")>;
  export default wrap;
}
```

---

License Apache-2.0

[when workers]: https://surma.dev/things/when-workers
[comlink]: https://github.com/GoogleChromeLabs/comlink
[omt plugin]: https://github.com/surma/rollup-plugin-off-main-thread
