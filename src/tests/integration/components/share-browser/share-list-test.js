import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | share browser/share list', function() {
  setupComponentTest('share-browser/share-list', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#share-browser/share-list}}
    //     template content
    //   {{/share-browser/share-list}}
    // `);

    this.render(hbs`{{share-browser/share-list}}`);
    expect(this.$()).to.have.length(1);
  });
});
