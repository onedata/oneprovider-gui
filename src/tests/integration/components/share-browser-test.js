import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | share browser', function() {
  setupComponentTest('share-browser', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#share-browser}}
    //     template content
    //   {{/share-browser}}
    // `);

    this.render(hbs`{{share-browser}}`);
    expect(this.$()).to.have.length(1);
  });
});
