const MagicString = require("magic-string");
const isReference = require("is-reference");
const { attachScopes } = require("@rollup/pluginutils");
const { walk } = require("estree-walker");

let inc = 1;

function generateWorkerName() {
  return `__comlink_import${inc++}`;
}

async function autoWrap({ code, ast, shouldAutoWrap, prefix }) {
  code = new MagicString(code);

  const refToProp = new Map();

  for (const node of ast.body) {
    // FIXME: currently we don't handle export from statement
    if (
      node.type === "ImportDeclaration" &&
      (await shouldAutoWrap(node.source.value))
    ) {
      const workerName =
        node.specifiers.find((s) => s.type === "ImportNamespaceSpecifier")
          ?.local.name || generateWorkerName();
      for (const spec of node.specifiers) {
        if (spec.type === "ImportDefaultSpecifier") {
          refToProp.set(spec.local.name, `${workerName}.default`);
        } else if (spec.type === "ImportSpecifier") {
          refToProp.set(spec.local.name, `${workerName}.${spec.imported.name}`);
        }
      }
      code.overwrite(
        node.start,
        node.end,
        `import ${workerName} from ${JSON.stringify(
          `${prefix}${node.source.value}`
        )}`
      );
    }
  }

  if (!refToProp.size) return;

  let scope = attachScopes(ast, "scope");

  walk(ast, {
    enter(node, parent) {
      if (node.type === "ImportDeclaration") this.skip();

      if (node.scope) scope = node.scope;

      if (
        node.type === "Identifier" &&
        refToProp.has(node.name) &&
        isReference(node, parent) &&
        !scope.contains(node.name)
      ) {
        code.overwrite(node.start, node.end, refToProp.get(node.name));
      }
    },
    leave(node) {
      if (node.scope) scope = node.scope.parent;
    },
  });

  return {
    code: code.toString(),
    map: code.generateMap(),
  };
}

module.exports = { autoWrap };
