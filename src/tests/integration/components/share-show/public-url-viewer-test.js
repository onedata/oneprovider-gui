import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | share show/public url viewer', function() {
  setupComponentTest('share-show/public-url-viewer', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#share-show/public-url-viewer}}
    //     template content
    //   {{/share-show/public-url-viewer}}
    // `);

    this.render(hbs`{{share-show/public-url-viewer}}`);
    expect(this.$()).to.have.length(1);
  });
});
