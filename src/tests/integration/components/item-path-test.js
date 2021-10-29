import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | item path', function () {
  setupComponentTest('item-path', {
    integration: true,
  });

  // FIXME: it renders text file path
  // FIXME: it renders space icon and space name in path
  // FIXME: it renders dataset and archive icons and names if file belongs to archive
  // FIXME: it does not render dataset and archive icons and names if file does not belong to any archive
  // FIXME: it renders tooltip file path in text form if hovered
  // FIXME: it does not render tooltip if file path does not overflow its container
  // FIXME: it shortens the rendered path by removing central entry if it overflows its container
  // FIXME: it shortens the rendered path by removing three central entries if it overflows its container
  // FIXME: it renders first entry with ellipsis if more entries overflows its container

  it('renders', function () {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // Template block usage:
    // this.render(hbs`
    //   {{#item-path}}
    //     template content
    //   {{/item-path}}
    // `);

    this.render(hbs `{{item-path}}`);
    expect(this.$()).to.have.length(1);
  });
});
