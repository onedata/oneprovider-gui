import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | dummy items select browser', function () {
  setupComponentTest('dummy-items-select-browser', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#dummy-items-select-browser}}
    //     template content
    //   {{/dummy-items-select-browser}}
    // `);

    this.render(hbs `{{dummy-items-select-browser}}`);
    expect(this.$()).to.have.length(1);
  });
});
