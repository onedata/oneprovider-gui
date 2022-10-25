import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-info-modal/tab-bar-li', function() {
  setupComponentTest('file-info-modal/tab-bar-li', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-info-modal/tab-bar-li}}
    //     template content
    //   {{/file-info-modal/tab-bar-li}}
    // `);

    this.render(hbs`{{file-info-modal/tab-bar-li}}`);
    expect(this.$()).to.have.length(1);
  });
});
