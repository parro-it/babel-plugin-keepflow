let moduleRoot = '../es6';
if (process.env.TEST_RELEASE) {
  moduleRoot = '../dist';
}

import { transform } from 'babel';

const babelPluginKeepFlow = require(moduleRoot);
const Module = module.constructor;

function requireFromString(src, filename) {
  const m = new Module();
  m.paths = module.paths;
  m._compile(src, filename);
  return m.exports;
}

const check = (source, expectedMeta, namedExport = null) => () => {
  const result = transform(source, {
    plugins: babelPluginKeepFlow
  });
  let test = requireFromString(result.code, __filename);
  if (typeof namedExport === 'string') {
    test = test[namedExport];
  } else if (typeof namedExport === 'function') {
    test = namedExport(test);
  }


  test.__meta.should.be.deep.equal(expectedMeta);
};

describe('babelPluginKeepFlow', () => {
  it('support string type as argument', check(
    'function testFun(a: string) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'string'
      }]
    }
  ));

  it('support boolean type as argument', check(
    'function testFun(a: boolean) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'boolean'
      }]
    }
  ));

  it('support number type as argument', check(
    'function testFun(a: number) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'number'
      }]
    }
  ));

  it('support any type as argument', check(
    'function testFun(a: any) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'any'
      }]
    }
  ));

  it('support void type as argument', check(
    'function testFun(a: void) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'void'
      }]
    }
  ));

  it('support mixed type as argument', check(
    'function testFun(a: mixed) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'mixed'
      }]
    }
  ));

  it('support multiple typed arguments', check(
    'function testFun(a: string,b: boolean) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'string'
      }, {
        name: 'b',
        type: 'boolean'
      }]
    }
  ));

  it('evaluate untyped as any', check(
    'function testFun(a,b) {}\n export default testFun;',
    {
      returnType: {
        type: 'any'
      },
      arguments: [{
        name: 'a',
        type: 'any'
      }, {
        name: 'b',
        type: 'any'
      }]
    }
  ));

  it('support function return types', check(
    'function testFun(): boolean {}\n export default testFun;',
    {
      arguments: [],
      returnType: {
        type: 'boolean'
      }
    }
  ));


  it('support object methods', check(
    'export const obj = { testFun(): boolean {} };',
    {
      arguments: [],
      returnType: {
        type: 'boolean'
      }
    },
    m => m.obj.testFun
  ));

  it('support object methods as function expression', check(
    'export const obj = { testFun: function(): boolean {} };',
    {
      arguments: [],
      returnType: {
        type: 'boolean'
      }
    },
    m => m.obj.testFun
  ));

  it('support untyped object methods as function expression', check(
    'export const obj = { testFun: function(a) {} };',
    {
      arguments: [{
          name: 'a',
          type: 'any'
        }],
      returnType: {
        type: 'any'
      }
    },
    m => m.obj.testFun
  ));

  it('support function export syntax', check(
    'export default function testFun(): boolean {}',
    {
      arguments: [],
      returnType: {
        type: 'boolean'
      }
    }
  ));

  it('support non-default function export syntax', check(
    'export function testFun(): boolean {}',
    {
      arguments: [],
      returnType: {
        type: 'boolean'
      }
    },
    'testFun'
  ));
});

