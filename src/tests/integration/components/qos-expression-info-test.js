import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | qos expression info', function() {
  setupComponentTest('qos-expression-info', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#qos-expression-info}}
    //     template content
    //   {{/qos-expression-info}}
    // `);

    this.render(hbs`{{qos-expression-info}}`);
    expect(this.$()).to.have.length(1);
  });
});
