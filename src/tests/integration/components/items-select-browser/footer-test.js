import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | items select browser/footer', function () {
  setupRenderingTest();

  it('displays injected submitLabel', async function () {
    const label = 'Custom button label';
    this.set('submitLabel', label);

    const $footer = await renderComponent(this);

    const $submitButton = $footer.find('.submit-selection-btn');
    const submitText = $submitButton.text().trim();

    expect(submitText).to.equal(label);
  });

  it('disables submit button when submitDisabled is true', async function () {
    this.set('submitDisabled', true);

    const $footer = await renderComponent(this);

    const $submitButton = $footer.find('.submit-selection-btn');

    expect($submitButton).to.have.attr('disabled');
  });
});

async function renderComponent(testCase) {
  await render(hbs `{{items-select-browser/footer
    validationError=validationError
    selectedItems=selectedItems
    submitDisabled=submitDisabled
    submitLabel=submitLabel
    onCancel=onCancel
    onSubmit=onSubmit
  }}`);
  return testCase.$('.items-select-browser-footer');
}
