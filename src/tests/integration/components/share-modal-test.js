import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../helpers/stub-service';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import { clearStoreAfterEach } from '../../helpers/clear-store';

describe('Integration | Component | share-modal', function () {
  setupRenderingTest();

  clearStoreAfterEach();

  it('sets name of new share from file to the name without extension', async function () {
    const helper = new Helper(this);
    helper.file = await helper.store.createRecord('file', {
      type: LegacyFileType.Regular,
      name: 'foo-2024.11.txt',
    }).save();

    await helper.openWithManager();

    expect(helper.nameInput.value).to.equal('foo-2024.11');
  });

  it('sets name of new share the same as file which does not have extension', async function () {
    const helper = new Helper(this);
    helper.file = await helper.store.createRecord('file', {
      type: LegacyFileType.Regular,
      name: 'foo-bar',
    }).save();

    await helper.openWithManager();

    expect(helper.nameInput.value).to.equal('foo-bar');
  });

  it('does not strip name of directory from dot', async function () {
    const helper = new Helper(this);
    helper.file = await helper.store.createRecord('file', {
      type: LegacyFileType.Directory,
      name: '2024.11.12',
    }).save();

    await helper.openWithManager();

    expect(helper.nameInput.value).to.equal('2024.11.12');
  });
});

class Helper {
  /** @type {Models.File} */
  file = undefined;

  /** @type {(share, isPublishing) => void} */
  onSubmitted = undefined;

  constructor(mochaContext) {
    this.mochaContext = mochaContext;
  }

  get modalManager() {
    return lookupService(this.mochaContext, 'modalManager');
  }

  get store() {
    return lookupService(this.mochaContext, 'store');
  }

  get element() {
    return find('.share-modal');
  }

  /** @type {HTMLInputElement} */
  get nameInput() {
    return this.element.querySelector('.new-share-name');
  }

  async openWithManager() {
    await render(hbs `<GlobalModalMounter />`);
    await this.modalManager.show('share-modal', {
      file: this.file,
      onSubmitted: this.onSubmitted,
    }).shownPromise;
  }
}
