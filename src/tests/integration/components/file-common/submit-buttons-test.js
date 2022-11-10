import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find, render, click } from '@ember/test-helpers';
import sinon from 'sinon';
import { assert } from '@ember/debug';
import OneTooltipHelper from '../../../helpers/one-tooltip';

import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | file-common/submit-buttons', function () {
  setupRenderingTest();

  it('renders non-disabled discard and save buttons with labels by default', async function () {
    const helper = new Helper(this);

    await helper.renderWithoutParams();

    expect(helper.getDiscardButton()).to.have.trimmed.text('Discard changes');
    expect(helper.getDiscardButton()).to.not.have.attr('disabled');
    expect(helper.getSaveButton()).to.have.trimmed.text('Save');
    expect(helper.getSaveButton()).to.not.have.attr('disabled');
  });

  it('invokes onSave callback on save click', async function () {
    const helper = new Helper(this);
    helper.templateArgs.onSave = sinon.spy();

    await helper.render();
    await click(helper.getSaveButton());

    expect(helper.templateArgs.onSave).to.have.been.calledOnce;
  });

  it('invokes onDiscard callback on discard click', async function () {
    const helper = new Helper(this);
    helper.templateArgs.onDiscard = sinon.spy();

    await helper.render();
    await click(helper.getDiscardButton());

    expect(helper.templateArgs.onDiscard).to.have.been.calledOnce;
  });

  it('renders discard button as disabled and non-clickable when isDiscardDisabled = true', async function () {
    const helper = new Helper(this);
    helper.templateArgs.isDiscardDisabled = true;
    helper.templateArgs.onDiscard = sinon.spy();

    await helper.render();
    await click(helper.getDiscardButton());

    expect(helper.getDiscardButton()).to.have.attr('disabled');
    expect(helper.templateArgs.onDiscard).to.have.been.not.called;
  });

  it('renders save button as disabled and non-clickable when isSaveDisabled = true', async function () {
    const helper = new Helper(this);
    helper.templateArgs.isSaveDisabled = true;
    helper.templateArgs.onSave = sinon.spy();

    await helper.render();
    await click(helper.getSaveButton());

    expect(helper.getSaveButton()).to.have.attr('disabled');
    expect(helper.templateArgs.onSave).to.have.been.not.called;
  });

  it('shows tooltip with provided text when saveTip is provided and save is enabled and hovered',
    async function () {
      const helper = new Helper(this);
      helper.templateArgs.saveTip = 'Hello world';

      await helper.render();
      const tooltipHelper = new OneTooltipHelper(helper.getSaveButton());
      const tooltipText = await tooltipHelper.getText();

      expect(tooltipText).to.equal(helper.templateArgs.saveTip);
    }
  );

  it('shows tooltip with provided text when saveTip is provided and save is disabled and hovered',
    async function () {
      const helper = new Helper(this);
      helper.templateArgs.isSaveDisabled = true;
      helper.templateArgs.saveTip = 'Hello world';

      await helper.render();
      const tooltipHelper = new OneTooltipHelper(helper.getSaveButton());
      const tooltipText = await tooltipHelper.getText();

      expect(tooltipText).to.equal(helper.templateArgs.saveTip);
    }
  );

  it('does not show tooltip with when saveTip is not provided',
    async function () {
      const helper = new Helper(this);

      await helper.renderWithoutParams();
      const tooltipHelper = new OneTooltipHelper(helper.getSaveButton());
      const hasTooltip = await tooltipHelper.hasTooltip();

      expect(hasTooltip).to.be.false;
    }
  );
});

/**
 * @typedef {Object} TestSubmitButtonsTemplateArgs
 * @property {boolean} isDiscardDisabled
 * @property {boolean} isSaveDisabled
 * @property {boolean} saveTip
 * @property {Function} onSave
 * @property {Function} onDiscard
 */

class Helper {
  constructor(mochaContext) {
    assert('mochaContext is mandatory', mochaContext);
    /** @type {Mocha.Context} */
    this.mochaContext = mochaContext;
    /** @type {TestSubmitButtonsTemplateArgs} */
    this.templateArgs = {};
  }
  /**
   * @private
   */
  applyTemplateArgs() {
    this.mochaContext.setProperties(this.templateArgs);
  }
  getElement() {
    return find('.file-common-submit-buttons');
  }
  getDiscardButton() {
    return this.getElement().querySelector('.btn-discard');
  }
  getSaveButton() {
    return this.getElement().querySelector('.btn-save');
  }
  async render() {
    this.applyTemplateArgs();
    return render(hbs`{{file-common/submit-buttons
      isDiscardDisabled=isDiscardDisabled
      isSaveDisabled=isSaveDisabled
      saveTip=saveTip
      onSave=onSave
      onDiscard=onDiscard
    }}`);
  }
  async renderWithoutParams() {
    this.applyTemplateArgs();
    return render(hbs`{{file-common/submit-buttons}}`);
  }
}
