import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | modal file subheader', function () {
  setupComponentTest('modal-file-subheader', {
    integration: true,
  });

  it('renders file name for single file', function () {
    this.set('files', [{
      type: 'file',
      index: 'hello.txt',
      name: 'hello.txt',
    }]);
    this.render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.$().text()).to.contain('hello.txt');
  });

  it('renders file icon for single file', function () {
    this.set('files', [{
      type: 'file',
      index: 'hello.txt',
      name: 'hello.txt',
    }]);
    this.render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.$('.file-item-icon')).to.have.class('oneicon-browser-file');
  });

  it('renders directory icon for single directory', function () {
    this.set('files', [{
      type: 'dir',
      index: 'hello',
      name: 'hello',
    }]);
    this.render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.$('.file-item-icon')).to.have.class('oneicon-browser-directory');
  });

  it('does not render icon for multiple items', function () {
    this.set('files', [{
      type: 'file',
      name: 'hello1.txt',
      index: 'hello1.txt',
    }, {
      type: 'dir',
      name: 'hello2.txt',
      index: 'hello2.txt',
    }]);
    this.render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.$('.file-item-icon')).to.not.exist;
  });

  it('renders items count for multiple items', function () {
    this.set('files', [{
      type: 'file',
      name: 'hello1.txt',
      index: 'hello1.txt',
    }, {
      type: 'dir',
      name: 'hello2.txt',
      index: 'hello2.txt',
    }]);
    this.render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.$().text()).to.contain('2');
  });

  it('renders file name and suffix separately if file name conflicts', function () {
    this.set('files', [{
      type: 'file',
      name: 'hello@1234',
      index: 'hello',
    }]);
    this.render(hbs `{{modal-file-subheader files=files}}`);
    expect(this.$('.file-base-name').text()).to.match(/^\S*hello\S*$/);
    expect(this.$('.file-suffix').text()).to.match(/^\S*@1234\S*$/);
  });
});
