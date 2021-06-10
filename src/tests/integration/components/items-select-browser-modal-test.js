import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | items select browser modal', function () {
  setupComponentTest('items-select-browser-modal', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#items-select-browser-modal}}
    //     template content
    //   {{/items-select-browser-modal}}
    // `);

    this.render(hbs `{{items-select-browser-modal}}`);
    expect(this.$()).to.have.length(1);
  });
});
