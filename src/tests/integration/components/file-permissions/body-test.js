import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-permissions/body', function() {
  setupComponentTest('file-permissions/body', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-permissions/body}}
    //     template content
    //   {{/file-permissions/body}}
    // `);

    this.render(hbs`{{file-permissions/body}}`);
    expect(this.$()).to.have.length(1);
  });
});
