/**
 * Strips module syntax and comments.
 */
module.exports = function babelPluginStripModules(fnName) {
  return function ({ types: t }) {
    return {
      visitor: {
        Program(path) {
          try {
            const program = path.parent.program;
            let nodes = program.body;
            let comments = program.body[0].leadingComments;

            // Swap "export default" for const
            let node = nodes[0];
            const isExportDefault = node.type === "ExportDefaultDeclaration";
            if (isExportDefault) {
              let fnExpression = node.declaration;
              if (fnExpression.type === "FunctionDeclaration") {
                fnExpression = t.arrowFunctionExpression(
                  fnExpression.params,
                  fnExpression.body,
                  fnExpression.async
                )
              }

              const constNode = t.variableDeclaration("const", [
                t.variableDeclarator(t.identifier(fnName), fnExpression),
              ]);
              constNode.leaderComments = null;
              constNode.trailingComments = null;
              node = constNode;
            }

            node.leadingComments = comments;

            path.parent.program = t.program([node]);
          } catch (err) {
            debugger;
          }
        },
      },
    };
  };
};
