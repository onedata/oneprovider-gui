import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | dummy archive recall', function() {
  setupComponentTest('dummy-archive-recall', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#dummy-archive-recall}}
    //     template content
    //   {{/dummy-archive-recall}}
    // `);

    this.render(hbs`{{dummy-archive-recall}}`);
    expect(this.$()).to.have.length(1);
  });
});
