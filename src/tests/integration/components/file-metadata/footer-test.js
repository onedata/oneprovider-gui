import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-metadata/footer', function() {
  setupComponentTest('file-metadata/footer', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-metadata/footer}}
    //     template content
    //   {{/file-metadata/footer}}
    // `);

    this.render(hbs`{{file-metadata/footer}}`);
    expect(this.$()).to.have.length(1);
  });
});
