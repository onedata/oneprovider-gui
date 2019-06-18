import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file browser', function() {
  setupComponentTest('file-browser', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-browser}}
    //     template content
    //   {{/file-browser}}
    // `);

    this.render(hbs`{{file-browser}}`);
    expect(this.$()).to.have.length(1);
  });
});
