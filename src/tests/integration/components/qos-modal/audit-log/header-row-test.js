import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | qos modal/audit log/header row', function() {
  setupComponentTest('qos-modal/audit-log/header-row', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#qos-modal/audit-log/header-row}}
    //     template content
    //   {{/qos-modal/audit-log/header-row}}
    // `);

    this.render(hbs`{{qos-modal/audit-log/header-row}}`);
    expect(this.$()).to.have.length(1);
  });
});
