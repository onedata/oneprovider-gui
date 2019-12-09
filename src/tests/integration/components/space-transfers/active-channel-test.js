import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | space transfers/active channel', function() {
  setupComponentTest('space-transfers/active-channel', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#space-transfers/active-channel}}
    //     template content
    //   {{/space-transfers/active-channel}}
    // `);

    this.render(hbs`{{space-transfers/active-channel}}`);
    expect(this.$()).to.have.length(1);
  });
});
