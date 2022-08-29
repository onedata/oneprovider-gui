import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-shares/header', function () {
  setupRenderingTest();

  // FIXME: remove if unused

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-shares/header}}
    //     template content
    //   {{/file-shares/header}}
    // `);

    this.render(hbs`{{file-shares/header}}`);
    expect(this.$()).to.have.length(1);
  });
});
