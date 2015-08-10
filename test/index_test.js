let moduleRoot = '../es6';
if (process.env.TEST_RELEASE) {
  moduleRoot = '../dist';
}

const babelPluginKeepFlow = require(moduleRoot);

describe('babelPluginKeepFlow', () => {
  it('works', async () => {
    const result = await babelPluginKeepFlow();
    result.should.be.equal(42);
  });
});

