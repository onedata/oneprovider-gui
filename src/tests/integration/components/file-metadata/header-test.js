import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-metadata/header', function() {
  setupComponentTest('file-metadata/header', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-metadata/header}}
    //     template content
    //   {{/file-metadata/header}}
    // `);

    this.render(hbs`{{file-metadata/header}}`);
    expect(this.$()).to.have.length(1);
  });
});
