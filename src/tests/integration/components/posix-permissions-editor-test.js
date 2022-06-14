import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, click, fillIn, triggerKeyEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

describe('Integration | Component | posix permissions editor', function () {
  setupRenderingTest();

  it('show initial posix value', async function () {
    await render(hbs `{{posix-permissions-editor initialPermissions="432"}}`);

    expect(find('.permissions-octal').value).to.equal('432');
    expect(find('.permissions-string-container')).to.contain.text('r-- -wx -w-');

    const selectedCheckboxes = [
      'user-read',
      'group-write',
      'group-execute',
      'other-write',
    ];
    selectedCheckboxes.forEach(checkboxName =>
      expect(find(`.${checkboxName}-checkbox`)).to.have.class('checked')
    );
    expect(findAll('.permission-checkbox.checked'))
      .to.have.length(selectedCheckboxes.length);
    expect(this.element.children).to.have.length(1);
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
        expect(find('.group-read-checkbox')).to.have.class('checked');
        expect(findAll('.permission-checkbox.checked')).to.have.length(1);
        expect(find('.permissions-string-container')).to.contain.text('--- r-- ---');
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
        expect(find('.permissions-octal').value).to.equal('400');
        expect(find('.permissions-string-container')).to.contain.text('r-- --- ---');
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
    return triggerKeyEvent('.permissions-octal', 'keydown', 13)
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
        expect(find('.permissions-octal-container')).to.have.class('has-error');
        expect(changeSpy).to.be.calledWith({ isValid: false, permissions: undefined });
      });
  });
});
