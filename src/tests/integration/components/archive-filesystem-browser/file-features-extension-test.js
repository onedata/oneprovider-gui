// FIXME: implement or remove

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | archive filesystem browser/file features extension', function () {
  setupComponentTest('archive-filesystem-browser/file-features-extension', {
    integration: true,
  });

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#archive-filesystem-browser/file-features-extension}}
    //     template content
    //   {{/archive-filesystem-browser/file-features-extension}}
    // `);

    this.render(hbs `{{archive-filesystem-browser/file-features-extension}}`);
    expect(this.$()).to.have.length(1);
  });
});
