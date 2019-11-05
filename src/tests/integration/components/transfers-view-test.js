import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | transfers view', function() {
  setupComponentTest('transfers-view', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#transfers-view}}
    //     template content
    //   {{/transfers-view}}
    // `);

    this.render(hbs`{{transfers-view}}`);
    expect(this.$()).to.have.length(1);
  });
});
