import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-permissions/header', function() {
  setupComponentTest('file-permissions/header', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-permissions/header}}
    //     template content
    //   {{/file-permissions/header}}
    // `);

    this.render(hbs`{{file-permissions/header}}`);
    expect(this.$()).to.have.length(1);
  });
});
