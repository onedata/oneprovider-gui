import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { lookupService } from '../../helpers/stub-service';
import wait from 'ember-test-helpers/wait';
import {
  createFilesChain,
} from '../../helpers/files';

describe('Integration | Component | item path', function () {
  setupComponentTest('item-path', {
    integration: true,
  });

  // FIXME: it renders text file path
  // FIXME: shows loading before path resolves
  // FIXME: it renders space icon and space name in path
  // FIXME: it renders dataset and archive icons and names if file belongs to archive
  // FIXME: it does not render dataset and archive icons and names if file does not belong to any archive
  // FIXME: it renders tooltip file path in text form if hovered
  // FIXME: it does not render tooltip if file path does not overflow its container
  // FIXME: it shortens the rendered path by removing central entry if it overflows its container
  // FIXME: it shortens the rendered path by removing three central entries if it overflows its container
  // FIXME: it renders first entry with ellipsis if more entries overflows its container

  beforeEach(function () {
    const getDataUrl = ({ selected: [firstSelected] }) => `link-${firstSelected}`;
    lookupService(this, 'app-proxy').callParent =
      function callParent(methodName, ...args) {
        if (methodName === 'getDataUrl') {
          return getDataUrl(...args);
        }
      };
  });

  // it('renders text of path to file in space', function () {});

  it('renders text of path to file in space', async function () {
    const filesChain = createFilesChain([
      'space root',
      'one',
      'two',
      'three',
      'file is here',
    ]);
    const item = filesChain[filesChain.length - 1];
    this.setProperties({
      item,
    });

    this.render(hbs `{{item-path item=item}}`);
    await wait();

    expect(this.$().text()).to.match(
      /space root\s*\/\s*one\s*\/\s*two\s*\/\s*three\s*\/\s*file is here\s*/
    );
  });
});
