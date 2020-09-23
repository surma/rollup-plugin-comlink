/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

const rollup = require("rollup");
const path = require("path");
const omt = require(".");
const fs = require("fs");

const karma = require("karma");
const myKarmaConfig = require("./karma.conf.js");

async function fileExists(file) {
  try {
    const stat = await fs.promises.stat(file);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

async function init() {
  await Promise.all(
    [
      "./tests/fixtures/simple-bundle/entry.js",
      "./tests/fixtures/module-worker/entry.js"
    ].map(async input => {
      const pathName = path.dirname(input);
      const outputOptions = {
        dir: path.join(pathName, "build"),
        format: "es"
      };
      const rollupConfigPath = "./" + path.join(pathName, "rollup.config.js");
      let rollupConfig = require(rollupConfigPath);
      const bundle = await rollup.rollup(rollupConfig);
      await bundle.write(rollupConfig.output);
    })
  );

  const karmaConfig = { port: 9876 };
  myKarmaConfig({
    set(config) {
      Object.assign(karmaConfig, config);
    }
  });
  const server = new karma.Server(karmaConfig, code => {
    console.log(`Karma exited with code ${code}`);
    process.exit(code);
  });
  server.start();
}
init();
