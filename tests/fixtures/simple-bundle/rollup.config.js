const omt = require("@surma/rollup-plugin-off-main-thread");
const comlink = require("../../../");
const resolve = require("@rollup/plugin-node-resolve").nodeResolve;

module.exports = {
  input: "./tests/fixtures/simple-bundle/entry.js",
  output: {
    dir: "./tests/fixtures/simple-bundle/build",
    format: "amd"
  },
  plugins: [resolve(), comlink(), omt()]
};
