import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | dataset archives browser', function() {
  setupComponentTest('dataset-archives-browser', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#dataset-archives-browser}}
    //     template content
    //   {{/dataset-archives-browser}}
    // `);

    this.render(hbs`{{dataset-archives-browser}}`);
    expect(this.$()).to.have.length(1);
  });
});
