import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file recall/logs/entry row', function() {
  setupComponentTest('file-recall/logs/entry-row', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-recall/logs/entry-row}}
    //     template content
    //   {{/file-recall/logs/entry-row}}
    // `);

    this.render(hbs`{{file-recall/logs/entry-row}}`);
    expect(this.$()).to.have.length(1);
  });
});
