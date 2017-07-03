'use strict';

/* globals QUnit */

const lint = require('qunit-eslint');

lint(['index.js', 'test.js']);

// work around https://github.com/qunitjs/qunit/issues/1182
const root = process.cwd();
for (let key in require.cache) {
  if (key.startsWith(root) && !key.startsWith(`${root}/node_modules`)) {
    delete require.cache[key];
  }
}

const GlimmerInlinePrecompile = require('babel-plugin-glimmer-inline-precompile');
const GlimmerInlinePrecompileAddon = require('./index');

QUnit.module('@glimmer/inline-precompile', hooks => {
  let fakeGlimmerAppInstance;

  hooks.before(() => {
    GlimmerInlinePrecompileAddon.parent = { };
    GlimmerInlinePrecompileAddon._super = {
      included() { },
    };
  });

  hooks.beforeEach(assert => {
    fakeGlimmerAppInstance = { options: { } };

    assert.hasBabelPlugin = () => {
      let plugins = fakeGlimmerAppInstance.options.babel.plugins;
      let hasPlugin = false;
      for (let i = 0; i < plugins.length; i++) {
        if (plugins[i][0] === GlimmerInlinePrecompile) {
          hasPlugin = true;
          break;
        }
      }

      assert.pushResult({
        result: hasPlugin,
        actual: plugins,
        message: 'glimmer-inline-precompile should be present',
      });
    };
  });

  hooks.after(() => {
    delete GlimmerInlinePrecompileAddon._super;
  });

  QUnit.test('adds plugin to options', assert => {
    GlimmerInlinePrecompileAddon.included(fakeGlimmerAppInstance);

    assert.hasBabelPlugin();
  });

  QUnit.test('merges with existing options', assert => {
    fakeGlimmerAppInstance.options.foo = true;
    GlimmerInlinePrecompileAddon.included(fakeGlimmerAppInstance);

    assert.hasBabelPlugin();
    assert.ok(fakeGlimmerAppInstance.options.foo);
  });

  QUnit.test('merges with existing babel options', assert => {
    fakeGlimmerAppInstance.options = { babel: { foo: true } };
    GlimmerInlinePrecompileAddon.included(fakeGlimmerAppInstance);

    assert.hasBabelPlugin();
    assert.ok(fakeGlimmerAppInstance.options.babel.foo);
  });

  QUnit.test('merges with existing babel plugins', assert => {
    fakeGlimmerAppInstance.options = { babel: { plugins: [['a']] } };
    GlimmerInlinePrecompileAddon.included(fakeGlimmerAppInstance);

    assert.hasBabelPlugin();
    assert.deepEqual(fakeGlimmerAppInstance.options.babel.plugins[0], ['a']);
  });

  QUnit.test('does not add if plugin is already present', assert => {
    fakeGlimmerAppInstance.options = {
      babel: {
        plugins: [[{ name: 'glimmer-inline-precompile', fakeEntry: true }]],
      },
    };
    GlimmerInlinePrecompileAddon.included(fakeGlimmerAppInstance);

    assert.deepEqual(fakeGlimmerAppInstance.options.babel.plugins, [
      [{ name: 'glimmer-inline-precompile', fakeEntry: true }],
    ]);
  });
});
