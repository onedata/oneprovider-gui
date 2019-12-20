import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | content shares', function() {
  setupComponentTest('content-shares', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#content-shares}}
    //     template content
    //   {{/content-shares}}
    // `);

    this.render(hbs`{{content-shares}}`);
    expect(this.$()).to.have.length(1);
  });
});
