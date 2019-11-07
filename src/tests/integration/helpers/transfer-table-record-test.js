import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Helper | transfer table record', function() {
  setupComponentTest('transfer-table-record', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#transfer-table-record}}
    //     template content
    //   {{/transfer-table-record}}
    // `);
    this.set('inputValue', '1234');

    this.render(hbs`{{transfer-table-record inputValue}}`);

    expect(this.$().text().trim()).to.equal('1234');
  });
});

