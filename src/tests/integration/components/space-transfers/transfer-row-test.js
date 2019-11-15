import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | space transfers/transfer row', function () {
  setupComponentTest('space-transfers/transfer-row', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#space-transfers/transfer-row}}
    //     template content
    //   {{/space-transfers/transfer-row}}
    // `);

    this.render(hbs `{{space-transfers/transfer-row}}`);
    expect(this.$()).to.have.length(1);
  });
});
