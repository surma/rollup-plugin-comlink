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

const defaultOpts = {
  marker: "comlink"
};

function generateLoaderModule(path) {
  return `
		import workerPath from "omt:${path}";
		import {wrap} from "comlink";

		export default wrap(new Worker(workerPath));
	`;
}

function generateWorkerWrapper(path) {
  return `
		import * as m from "${path}";
		import {expose} from "comlink";

		expose(m);
	`;
}

module.exports = function(opts = {}) {
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

    load(id) {
      if (id.endsWith(suffix) && !id.startsWith("omt:")) {
        const wrapper = generateWorkerWrapper(id.slice(0, -suffix.length));
        return wrapper;
      }
      if (!id.startsWith(prefix)) return;

      const realId = id.slice(prefix.length) + suffix;
      const loader = generateLoaderModule(realId);
      return loader;
    }
  };
};
