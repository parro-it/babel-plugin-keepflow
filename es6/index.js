
// import { transform } from 'babel';

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
        enter(node) {
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
        },
        exit(node, parent) {
          if (parent.type !== 'ExportDefaultDeclaration' && parent.type !== 'ExportNamedDeclaration') {
            return [
              node,
              valueToMetaAssignment(node.id.name, t.valueToNode(node.__meta))
            ];
          }
        }
      },
      ExportNamedDeclaration: {
        exit(node) {
          if (node.declaration.type === 'FunctionDeclaration') {
            return [
              node,
              valueToMetaAssignment(node.declaration.id.name, t.valueToNode(node.declaration.__meta))
            ];
          }
        }
      },
      ExportDefaultDeclaration: {
        exit(node) {
          if (node.declaration.type === 'FunctionDeclaration') {
            return [
              node,
              valueToMetaAssignment(node.declaration.id.name, t.valueToNode(node.declaration.__meta))
            ];
          }
        }
      }
    }
  });
}
