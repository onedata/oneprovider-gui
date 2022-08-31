import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-qos/footer', function() {
  setupComponentTest('file-qos/footer', {
    integration: true
  });

  it('renders', function() {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#file-qos/footer}}
    //     template content
    //   {{/file-qos/footer}}
    // `);

    this.render(hbs`{{file-qos/footer}}`);
    expect(this.$()).to.have.length(1);
  });
});
