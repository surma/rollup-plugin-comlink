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

function jsBlobFromString(s) {
  return URL.createObjectURL(new Blob([s], { type: "text/javascript" }));
}

// If `new Worker()` checks the `type` prop on the options object
// we can be fairly sure that the browser supports module workers.
// If so, replace we can switch `maybeIt` from ignoring tests (`xit`)
// to actually running the tests (`it`).
let maybeIt = xit;
let wasRead = false;
const detector = {
  get type() {
    wasRead = true;
    return "module";
  }
};
new Worker(jsBlobFromString("export default 4"), detector).terminate();
if (wasRead) {
  maybeIt = it;
}

describe("Comlink plugin", function() {
  beforeEach(function() {
    this.ifr = document.createElement("iframe");
    document.body.append(this.ifr);
  });

  afterEach(function() {
    this.ifr.remove();
  });

  maybeIt("proxies module workers", function(done) {
    window.addEventListener("message", function l(ev) {
      if (ev.data === "a") {
        window.removeEventListener("message", l);
        done();
      }
    });
    this.ifr.src = "/base/tests/fixtures/module-worker/build/runner.html";
  });
});
