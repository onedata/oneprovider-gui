import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file datasets/tab archives', function () {
  setupComponentTest('file-datasets/tab-archives', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-datasets/tab-archives}}
    //     template content
    //   {{/file-datasets/tab-archives}}
    // `);

    this.render(hbs `{{file-datasets/tab-archives}}`);
    expect(this.$()).to.have.length(1);
  });
});
