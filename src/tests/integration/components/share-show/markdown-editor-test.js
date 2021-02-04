import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import I18nStub from '../../../helpers/i18n-stub';
import { registerService } from '../../../helpers/stub-service';
import sinon from 'sinon';
import { fillIn } from 'ember-native-dom-helpers';

describe('Integration | Component | share show/markdown editor', function () {
  setupComponentTest('share-show/markdown-editor', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'i18n', I18nStub);
  });

  it('renders HTML generated from Markdown source in "visual" mode', function () {
    this.set('markdown', '# hello world');

    this.render(hbs `{{share-show/markdown-editor
      markdown=markdown
      mode="visual"
    }}`);

    const $markdownToHtml = this.$('.one-markdown-to-html');
    expect($markdownToHtml).to.have.length(1);
    const $h1 = $markdownToHtml.find('h1');
    expect($h1).to.have.length(1);
    expect($h1.text().trim()).to.equal('hello world');
  });

  it('renders textarea that render Markdown source in "markdown" mode', function () {
    this.set('markdown', '# hello world');

    this.render(hbs `{{share-show/markdown-editor
      markdown=markdown
      mode="markdown"
    }}`);

    const $textarea = this.$('textarea.textarea-source-editor');
    expect($textarea).to.have.length(1);
    expect($textarea.val()).to.equal(this.get('markdown'));
  });

  it('renders textarea that emits edited code in "markdown" mode on change', async function () {
    const onMarkdownChangeSpy = sinon.spy();
    this.on('onMarkdownChange', onMarkdownChangeSpy);
    this.render(hbs `{{share-show/markdown-editor
      markdown=""
      onMarkdownChange=(action "onMarkdownChange")
      mode="markdown"
    }}`);

    await fillIn('textarea.textarea-source-editor', 'hello');
    expect(onMarkdownChangeSpy).to.be.calledOnce;
    expect(onMarkdownChangeSpy).to.be.calledWith('hello');
  });
});
