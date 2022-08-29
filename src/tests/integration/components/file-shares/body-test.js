import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-shares/body', function() {
  setupComponentTest('file-shares/body', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-shares/body}}
    //     template content
    //   {{/file-shares/body}}
    // `);

    this.render(hbs`{{file-shares/body}}`);
    expect(this.$()).to.have.length(1);
  });
});
