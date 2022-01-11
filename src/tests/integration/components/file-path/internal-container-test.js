import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file path/internal container', function() {
  setupComponentTest('file-path/internal-container', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-path/internal-container}}
    //     template content
    //   {{/file-path/internal-container}}
    // `);

    this.render(hbs`{{file-path/internal-container}}`);
    expect(this.$()).to.have.length(1);
  });
});
