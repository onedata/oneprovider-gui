import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | modal file subheader', function () {
  setupRenderingTest();

  it('renders file name for single file', async function () {
    this.set('files', [{
      type: 'file',
      index: 'hello.txt',
      name: 'hello.txt',
    }]);
    await render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.element).to.contain.text('hello.txt');
  });

  it('renders file icon for single file', async function () {
    this.set('files', [{
      type: 'file',
      index: 'hello.txt',
      name: 'hello.txt',
    }]);
    await render(hbs `{{modal-file-subheader files=files}}`);
    expect(find('.file-item-icon')).to.have.class('oneicon-browser-file');
  });

  it('renders directory icon for single directory', async function () {
    this.set('files', [{
      type: 'dir',
      index: 'hello',
      name: 'hello',
    }]);
    await render(hbs `{{modal-file-subheader files=files}}`);
    expect(find('.file-item-icon')).to.have.class('oneicon-browser-directory');
  });

  it('renders "items grid" icon for multiple items', async function () {
    this.set('files', [{
      type: 'file',
      name: 'hello1.txt',
      index: 'hello1.txt',
    }, {
      type: 'dir',
      name: 'hello2.txt',
      index: 'hello2.txt',
    }]);
    await render(hbs`{{modal-file-subheader files=files}}`);
    const fileItemIcon = find('.file-item-icon');
    expect(fileItemIcon).to.exist;
    expect(fileItemIcon).to.have.class('oneicon-items-grid');
  });

  it('renders names of items for multiple items', async function () {
    this.set('files', [{
      type: 'file',
      name: 'hello1.txt',
      index: 'hello1.txt',
    }, {
      type: 'dir',
      name: 'hello2.txt',
      index: 'hello2.txt',
    }]);
    await render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.element)
      .to.contain.text('hello1.txt')
      .and
      .to.contain.text('hello2.txt');
  });

  it('renders names with conflict suffix of items for multiple items with name conflict', async function () {
    this.set('files', [{
      type: 'file',
      name: 'hello@a123',
      conflictingName: 'hello',
    }, {
      type: 'file',
      name: 'hello@b456',
      conflictingName: 'hello',
    }]);

    await render(hbs`{{modal-file-subheader files=files}}`);

    const baseNames = [...findAll('.file-base-name')];
    expect(baseNames[0]).to.have.trimmed.text('hello');
    expect(baseNames[1]).to.have.trimmed.text('hello');

    const suffixes = [...findAll('.file-suffix')];
    expect(suffixes[0]).to.have.trimmed.text('@a123');
    expect(suffixes[1]).to.have.trimmed.text('@b456');
  });

  it('renders items count for multiple items', async function () {
    this.set('files', [{
      type: 'file',
      name: 'hello1.txt',
      index: 'hello1.txt',
    }, {
      type: 'dir',
      name: 'hello2.txt',
      index: 'hello2.txt',
    }]);
    await render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.element).to.contain.text('2');
  });

  it('renders file name and suffix separately if file name conflicts', async function () {
    this.set('files', [{
      type: 'file',
      name: 'hello@1234',
      conflictingName: 'hello',
    }]);
    await render(hbs `{{modal-file-subheader files=files}}`);
    expect(find('.file-base-name').textContent).to.match(/^\S*hello\S*$/);
    expect(find('.file-suffix').textContent).to.match(/^\S*@1234\S*$/);
  });
});
