import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | content file browser', function() {
  setupComponentTest('content-file-browser', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#content-file-browser}}
    //     template content
    //   {{/content-file-browser}}
    // `);

    this.render(hbs`{{content-file-browser}}`);
    expect(this.$()).to.have.length(1);
  });
});
