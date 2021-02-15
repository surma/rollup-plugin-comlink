/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { readFileSync } = require("fs");
const { join } = require("path");

const { autoWrap } = require("./autowrap");

const defaultOpts = {
  marker: "comlink",
  useModuleWorker: false,
  autoWrap: [],
};

function generateLoaderModule(path, { useModuleWorker = false } = {}) {
  return `
		import workerPath from ${JSON.stringify(`omt:${path}`)};
		import {wrap} from "comlink";

		export default wrap(new Worker(workerPath${
      useModuleWorker ? `, {type: "module"}` : ""
    }));
	`;
}

function generateWorkerWrapper(path) {
  return `
		import * as m from ${JSON.stringify(path)};
		import {expose} from "comlink";

		expose(m);
	`;
}

module.exports = function (opts = {}) {
  opts = Object.assign({}, defaultOpts, opts);

  const prefix = opts.marker + ":";
  const suffix = "?" + opts.marker;

  return {
    name: "comlink",

    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) return;

      const path = id.slice(prefix.length);
      const newId = (await this.resolve(path, importer)).id;

      if (!newId) throw Error(`Cannot find module '${path}'`);

      return prefix + newId;
    },

    transform(code, id) {
      if (
        id.endsWith(suffix) ||
        id.startsWith(prefix) ||
        id.startsWith("omt:") ||
        id.startsWith("\0")
      )
        return;
      const ast = this.parse(code);
      return autoWrap({
        code,
        ast,
        prefix,
        shouldAutoWrap: async (importee) => {
          const result = await this.resolve(importee, id);
          return (
            result && result.id && opts.autoWrap.some((r) => r.test(result.id))
          );
        },
      });
    },

    outputOptions({ format }) {
      if ((format === "esm" || format === "es") && !opts.useModuleWorker) {
        this.error(
          `Can only use {format: "${format}"} with {useModuleWorker: true}`
        );
        return;
      }
      if (format === "amd" && opts.useModuleWorker) {
        this.error(
          `Can only use {useModuleWorker: true} with {format: "${format}"}`
        );
        return;
      }
      if (format !== "amd" && format !== "esm" && format != "es") {
        this.error(
          "Output format MUST be `amd`. `esm` is also allowed, but has very little browser support."
        );
        return;
      }
    },

    load(id) {
      if (id.endsWith(suffix) && !id.startsWith("omt:")) {
        const wrapper = generateWorkerWrapper(id.slice(0, -suffix.length));
        return wrapper;
      }
      if (!id.startsWith(prefix)) return;

      const realId = id.slice(prefix.length) + suffix;
      const loader = generateLoaderModule(realId, opts);
      return loader;
    },
  };
};
