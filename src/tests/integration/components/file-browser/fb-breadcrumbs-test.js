import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file browser/fb breadcrumbs', function() {
  setupComponentTest('file-browser/fb-breadcrumbs', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-browser/fb-breadcrumbs}}
    //     template content
    //   {{/file-browser/fb-breadcrumbs}}
    // `);

    this.render(hbs`{{file-browser/fb-breadcrumbs}}`);
    expect(this.$()).to.have.length(1);
  });
});
