import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | archive-audit-log/cell-file', function() {
  setupComponentTest('archive-audit-log/cell-file', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#archive-audit-log/cell-file}}
    //     template content
    //   {{/archive-audit-log/cell-file}}
    // `);

    this.render(hbs`{{archive-audit-log/cell-file}}`);
    expect(this.$()).to.have.length(1);
  });
});
