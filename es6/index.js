

function functionExpressionDecorator(functionExpression, t) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'FunctionExpression',
        id: null,
        params: [],
        defaults: [],
        body: {
          type: 'BlockStatement',
          body: [{
            type: 'VariableDeclaration',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: {
                  type: 'Identifier',
                  name: '$__unnamed'
                },
                init: functionExpression
              }
            ],
            kind: 'var'
          }, {
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: '=',
              left: {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'Identifier',
                  name: '$__unnamed'
                },
                property: {
                  type: 'Identifier',
                  name: '__meta'
                }
              },
              right: t.valueToNode(functionExpression.__meta)
            }
          }, {
            type: 'ReturnStatement',
            argument: {
              type: 'Identifier',
              name: '$__unnamed'
            }
          }]
        },
        generator: false,
        expression: false
      },
      arguments: []
    }
  };
}

function valueToMetaAssignment(name, meta) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
          type: 'MemberExpression',
          computed: false,
          object: {
              type: 'Identifier',
              name
          },
          property: {
              type: 'Identifier',
              name: '__meta'
          }
      },
      right: meta
    }
  };
}

function mkTypeVisitor(resultType) {
  return {
    exit: node => {
      node.__metaArg.type = resultType;
    }
  };
}


function mkExportVisitor(t) {
  return {
    exit(node) {
      if (node.declaration.type === 'FunctionDeclaration') {
        return [
          node,
          valueToMetaAssignment(node.declaration.id.name, t.valueToNode(node.declaration.__meta))
        ];
      }
    }
  };
}

function mkFunctionEnter(node) {
  node.__meta = node.__meta || {
    arguments: [],
    returnType: {
      type: 'any'
    }
  };

  if (node.returnType) {
    node.returnType.typeAnnotation.__metaArg = node.__meta.returnType;
  }

  node.params.forEach( p => {
    const metaArg = {
      name: p.name,
      type: 'any'
    };

    node.__meta.arguments.push(metaArg);

    if (p.typeAnnotation) {
      p.typeAnnotation.typeAnnotation.__metaArg = metaArg;
    }
  });
}


export default function babelPluginKeepFlow({ Plugin, types: t }) {
  return new Plugin('babel-plugin-keepflow', {
    visitor: {
      AnyTypeAnnotation: mkTypeVisitor('any'),
      StringTypeAnnotation: mkTypeVisitor('string'),
      NumberTypeAnnotation: mkTypeVisitor('number'),
      BooleanTypeAnnotation: mkTypeVisitor('boolean'),
      VoidTypeAnnotation: mkTypeVisitor('void'),
      MixedTypeAnnotation: mkTypeVisitor('mixed'),

      FunctionDeclaration: {
        enter: mkFunctionEnter,
        exit(node, parent) {
          if (parent.type !== 'ExportDefaultDeclaration' && parent.type !== 'ExportNamedDeclaration') {
            return [
              node,
              valueToMetaAssignment(node.id.name, t.valueToNode(node.__meta))
            ];
          }
        }
      },

      FunctionExpression: {
        enter: mkFunctionEnter,
        exit(node) {
          return functionExpressionDecorator(node, t);
        }
      },
      ExportNamedDeclaration: mkExportVisitor(t),
      ExportDefaultDeclaration: mkExportVisitor(t)
    }
  });
}
