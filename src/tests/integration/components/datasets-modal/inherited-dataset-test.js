import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | datasets modal/inherited dataset', function() {
  setupComponentTest('datasets-modal/inherited-dataset', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#datasets-modal/inherited-dataset}}
    //     template content
    //   {{/datasets-modal/inherited-dataset}}
    // `);

    this.render(hbs`{{datasets-modal/inherited-dataset}}`);
    expect(this.$()).to.have.length(1);
  });
});
