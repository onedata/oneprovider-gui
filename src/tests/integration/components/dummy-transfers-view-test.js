import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | dummy transfers view', function() {
  setupComponentTest('dummy-transfers-view', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#dummy-transfers-view}}
    //     template content
    //   {{/dummy-transfers-view}}
    // `);

    this.render(hbs`{{dummy-transfers-view}}`);
    expect(this.$()).to.have.length(1);
  });
});
