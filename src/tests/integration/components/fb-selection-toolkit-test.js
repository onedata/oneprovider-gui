import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | fb selection toolkit', function () {
  setupComponentTest('fb-selection-toolkit', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#fb-selection-toolkit}}
    //     template content
    //   {{/fb-selection-toolkit}}
    // `);

    this.render(hbs `{{fb-selection-toolkit}}`);
    expect(this.$()).to.have.length(1);
  });
});
