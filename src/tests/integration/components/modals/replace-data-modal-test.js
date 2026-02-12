import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../../helpers/stub-service';
import { clearStoreAfterEach } from '../../../helpers/clear-store';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import moment from 'moment';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

describe('Integration | Component | modals/replace-data-modal', function () {
  const { afterEach } = setupRenderingTest();

  clearStoreAfterEach(afterEach);

  it('renders', async function () {
    const helper = new Helper(this);
    await helper.renderGlobalModal();
    await helper.showModal().shownPromise;

    expect(helper.getElement()).to.exist;
  });

  it('renders header, intro text', async function () {
    const helper = new Helper(this);
    await helper.renderGlobalModal();
    await helper.showModal().shownPromise;
    const element = helper.getElement();
    expect(element.querySelector('h1').textContent).to.contain('Replace file content');
    expect(element.textContent).to.contain('You can replace');
  });

  it('renders file name, size, modification time', async function () {
    const helper = new Helper(this);
    const modificationMoment = moment();
    const file = await helper.createFile({
      type: LegacyFileType.Regular,
      name: 'Test-File',
      size: 2048,
      mtime: modificationMoment.unix(),
    });
    await helper.renderGlobalModal();
    await helper.showModal({
      file,
    }).shownPromise;

    const displayedName = helper.getExistingFileInfo()
      .querySelector('.single-file-info-file-name')
      .textContent
      .trim();
    const displayedSize = helper.getExistingFileInfo()
      .querySelector('.download-file-size')
      .textContent
      .trim();
    const displayedModificationTime = helper.getExistingFileInfo()
      .querySelector('.download-file-modification')
      .textContent
      .trim();

    expect(displayedName).to.equal(file.name);
    expect(displayedSize).to.equal('2 KiB');
    const expectedModificationTime = dateFormat([file.mtime], {
      format: 'dateWithMinutes',
    });
    expect(displayedModificationTime).to.equal(expectedModificationTime);
  });
});

class Helper {
  /**
   * @param {Mocha.Context} mochaContext
   */
  constructor(mochaContext) {
    this.mochaContext = mochaContext;
  }

  /** @returns {Ember.Service} */
  getService(serviceName) {
    return lookupService(this.mochaContext, serviceName);
  }

  get modalManager() {
    return this.getService('modal-manager');
  }

  /** @returns {Ember.Store} */
  get store() {
    return this.getService('store');
  }

  async createFile(data) {
    return this.store.createRecord('file', data);
  }

  /** @returns {HTMLDivElement} */
  getElement() {
    return find('.replace-data-modal');
  }

  getExistingFileInfo() {
    return this.getElement().querySelector('.existing-file-info');
  }

  showModal(modalOptions = {}) {
    return this.modalManager.show('replace-data-modal', modalOptions);
  }

  async renderGlobalModal() {
    await render(hbs`
      <GlobalModalMounter />
    `);
  }
}
