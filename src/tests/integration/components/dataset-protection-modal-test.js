import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | dataset protection modal', function () {
  setupComponentTest('dataset-protection-modal', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#dataset-protection-modal}}
    //     template content
    //   {{/dataset-protection-modal}}
    // `);

    this.render(hbs `{{dataset-protection-modal}}`);
    expect(this.$()).to.have.length(1);
  });
});
