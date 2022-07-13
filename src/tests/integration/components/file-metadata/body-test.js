import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-metadata/body', function () {
  setupComponentTest('file-metadata/body', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-metadata/body}}
    //     template content
    //   {{/file-metadata/body}}
    // `);

    this.render(hbs`{{file-metadata/body}}`);
    expect(this.$()).to.have.length(1);
  });
});
