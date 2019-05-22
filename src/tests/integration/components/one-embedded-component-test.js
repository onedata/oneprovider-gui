import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | one embedded component', function () {
  setupComponentTest('one-embedded-component', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#embedded-component}}
    //     template content
    //   {{/embedded-component}}
    // `);

    this.render(hbs `{{embedded-component}}`);
    expect(this.$()).to.have.length(1);
  });
});
