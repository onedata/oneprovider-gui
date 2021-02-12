import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | share show/url info handle', function() {
  setupComponentTest('share-show/url-info-handle', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#share-show/url-info-handle}}
    //     template content
    //   {{/share-show/url-info-handle}}
    // `);

    this.render(hbs`{{share-show/url-info-handle}}`);
    expect(this.$()).to.have.length(1);
  });
});
