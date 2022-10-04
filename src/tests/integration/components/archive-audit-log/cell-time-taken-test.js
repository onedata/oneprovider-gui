import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | archive-audit-log/cell-time-taken', function() {
  setupComponentTest('archive-audit-log/cell-time-taken', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#archive-audit-log/cell-time-taken}}
    //     template content
    //   {{/archive-audit-log/cell-time-taken}}
    // `);

    this.render(hbs`{{archive-audit-log/cell-time-taken}}`);
    expect(this.$()).to.have.length(1);
  });
});
