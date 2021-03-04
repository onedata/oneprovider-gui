import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | datasets modal', function() {
  setupComponentTest('datasets-modal', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#datasets-modal}}
    //     template content
    //   {{/datasets-modal}}
    // `);

    this.render(hbs`{{datasets-modal}}`);
    expect(this.$()).to.have.length(1);
  });
});
