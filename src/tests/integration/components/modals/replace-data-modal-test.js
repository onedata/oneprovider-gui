import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../../helpers/stub-service';

describe('Integration | Component | modals/replace-data-modal', function () {
  setupRenderingTest();

  it('renders', async function () {
    const helper = new Helper(this);
    await helper.renderGlobalModal();
    await helper.showModal().shownPromise;

    expect(find('.replace-data-modal')).to.exist;
  });
});

class Helper {
  /**
   * @param {Mocha.Context} mochaContext
   */
  constructor(mochaContext) {
    this.mochaContext = mochaContext;
  }

  get modalManager() {
    return lookupService(this.mochaContext, 'modal-manager');
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
