import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | modals/external symlink modal', function() {
  setupComponentTest('modals/external-symlink-modal', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#modals/external-symlink-modal}}
    //     template content
    //   {{/modals/external-symlink-modal}}
    // `);

    this.render(hbs`{{modals/external-symlink-modal}}`);
    expect(this.$()).to.have.length(1);
  });
});
