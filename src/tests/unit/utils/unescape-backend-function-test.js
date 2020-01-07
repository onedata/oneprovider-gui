import { expect } from 'chai';
import { describe, it } from 'mocha';
import unescapeBackendFunction from 'oneprovider-gui/utils/unescape-backend-function';

describe('Unit | Utility | unescape backend function', function () {
  it('escapes string', function () {
    const functionString = `
function hello(world) {
  var a = \\"\\\\usr\\\\local\\\\bin\\";
  var b = \\'other\\';
  var c = \\'hello\\\\nworld\\';
}
    `;

    const result = unescapeBackendFunction(functionString);

    expect(result).to.equal(`
function hello(world) {
  var a = "\\usr\\local\\bin";
  var b = 'other';
  var c = 'hello\\nworld';
}
    `);
  });
});
