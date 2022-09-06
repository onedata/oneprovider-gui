import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-distribution/body', function() {
  setupComponentTest('file-distribution/body', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-distribution/body}}
    //     template content
    //   {{/file-distribution/body}}
    // `);

    this.render(hbs`{{file-distribution/body}}`);
    expect(this.$()).to.have.length(1);
  });
});
