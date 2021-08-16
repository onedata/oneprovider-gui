import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | items select browser/footer', function () {
  setupComponentTest('items-select-browser/footer', {
    integration: true,
  });

  it('displays injected submitLabel', function () {
    const label = 'Custom button label';
    this.set('submitLabel', label);

    const $footer = render(this);

    const $submitButton = $footer.find('.submit-selection-btn');
    const submitText = $submitButton.text().trim();

    expect(submitText).to.equal(label);
  });

  it('disables submit button when submitDisabled is true', function () {
    this.set('submitDisabled', true);

    const $footer = render(this);

    const $submitButton = $footer.find('.submit-selection-btn');

    expect($submitButton).to.have.attr('disabled');
  });
});

function render(testCase) {
  testCase.render(hbs `{{items-select-browser/footer
    validationError=validationError
    selectedItems=selectedItems
    submitDisabled=submitDisabled
    submitLabel=submitLabel
    onCancel=onCancel
    onSubmit=onSubmit
  }}`);
  return testCase.$('.items-select-browser-footer');
}
