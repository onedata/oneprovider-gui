import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file recall/logs/header row', function() {
  setupComponentTest('file-recall/logs/header-row', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-recall/logs/header-row}}
    //     template content
    //   {{/file-recall/logs/header-row}}
    // `);

    this.render(hbs`{{file-recall/logs/header-row}}`);
    expect(this.$()).to.have.length(1);
  });
});
