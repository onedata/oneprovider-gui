import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

describe('Integration | Component | items-select-browser/footer', function () {
  setupRenderingTest();

  it('displays injected submitLabel', async function () {
    const label = 'Custom button label';
    this.set('submitLabel', label);

    const footer = await renderComponent();

    const submitButton = footer.querySelector('.submit-selection-btn');

    expect(submitButton).to.have.trimmed.text(label);
  });

  it('disables submit button when submitDisabled is true', async function () {
    this.set('submitDisabled', true);

    const footer = await renderComponent();

    const submitButton = footer.querySelector('.submit-selection-btn');

    expect(submitButton).to.have.attr('disabled');
  });
});

async function renderComponent() {
  await render(hbs `{{items-select-browser/footer
    validationError=validationError
    selectedItems=selectedItems
    submitDisabled=submitDisabled
    submitLabel=submitLabel
    onCancel=onCancel
    onSubmit=onSubmit
  }}`);
  return find('.items-select-browser-footer');
}
