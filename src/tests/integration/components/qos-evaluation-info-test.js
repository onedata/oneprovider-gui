import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | qos evaluation info', function() {
  setupComponentTest('qos-evaluation-info', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#qos-evaluation-info}}
    //     template content
    //   {{/qos-evaluation-info}}
    // `);

    this.render(hbs`{{qos-evaluation-info}}`);
    expect(this.$()).to.have.length(1);
  });
});
