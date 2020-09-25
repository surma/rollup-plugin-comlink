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

const omt = require("@surma/rollup-plugin-off-main-thread");
const comlink = require("../../../");
const resolve = require("@rollup/plugin-node-resolve").nodeResolve;

module.exports = {
  input: `${__dirname}/entry.js`,
  output: {
    dir: `${__dirname}/build`,
    format: "amd",
  },
  plugins: [resolve(), comlink(), omt()],
};
