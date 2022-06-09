import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { click, fillIn, keyEvent } from 'ember-native-dom-helpers';

describe('Integration | Component | posix permissions editor', function () {
  setupRenderingTest();

  it('show initial posix value', async function () {
    await render(hbs `{{posix-permissions-editor initialPermissions="432"}}`);

    expect(this.$('.permissions-octal').val()).to.equal('432');
    expect(this.$('.permissions-string-container')).to.contain('r-- -wx -w-');

    const selectedCheckboxes = [
      'user-read',
      'group-write',
      'group-execute',
      'other-write',
    ];
    selectedCheckboxes.forEach(checkboxName =>
      expect(this.$(`.${checkboxName}-checkbox`)).to.have.class('checked')
    );
    expect(this.$('.permission-checkbox.checked'))
      .to.have.length(selectedCheckboxes.length);
    expect(this.$()).to.have.length(1);
  });

  it('modifies value with input', async function () {
    const changeSpy = sinon.spy();
    this.set('change', changeSpy);
    await render(hbs `
      {{posix-permissions-editor
        initialPermissions="000"
        onChange=(action change)}}
    `);

    return fillIn('.permissions-octal', '040')
      .then(() => {
        expect(this.$('.group-read-checkbox')).to.have.class('checked');
        expect(this.$('.permission-checkbox.checked')).to.have.length(1);
        expect(this.$('.permissions-string-container')).to.contain('--- r-- ---');
        expect(changeSpy).to.be.calledWith({ isValid: true, permissions: '040' });
      });
  });

  it('modifies value with checkbox', async function () {
    const changeSpy = sinon.spy();
    this.set('change', changeSpy);
    await render(hbs `
      {{posix-permissions-editor
        initialPermissions="000"
        onChange=(action change)}}
    `);

    return click('.user-read-checkbox')
      .then(() => {
        expect(this.$('.permissions-octal').val()).to.equal('400');
        expect(this.$('.permissions-string-container')).to.contain('r-- --- ---');
        expect(changeSpy).to.be.calledWith({ isValid: true, permissions: '400' });
      });
  });

  it('saves value on Enter press inside input', async function () {
    const saveSpy = sinon.spy();
    this.set('save', saveSpy);
    await render(hbs `
      {{posix-permissions-editor
        initialPermissions="000"
        onSave=(action save)}}
    `);

    // 13 is Enter
    return keyEvent('.permissions-octal', 'keydown', 13)
      .then(() => expect(saveSpy).to.be.calledOnce);
  });

  it('detects incorrect octal value in input', async function () {
    const changeSpy = sinon.spy();
    this.set('change', changeSpy);
    await render(hbs `
      {{posix-permissions-editor
        initialPermissions="000"
        onChange=(action change)}}
    `);

    return fillIn('.permissions-octal', '778')
      .then(() => {
        expect(this.$('.permissions-octal-container')).to.have.class('has-error');
        expect(changeSpy).to.be.calledWith({ isValid: false, permissions: undefined });
      });
  });
});
