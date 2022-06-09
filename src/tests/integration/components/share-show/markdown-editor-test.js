import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import I18nStub from '../../../helpers/i18n-stub';
import { registerService } from '../../../helpers/stub-service';
import sinon from 'sinon';
import { fillIn } from 'ember-native-dom-helpers';

describe('Integration | Component | share show/markdown editor', function () {
  setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'i18n', I18nStub);
  });

  it('renders HTML generated from Markdown source in "visual" mode', async function () {
    this.set('markdown', '# hello world');

    await render(hbs `{{share-show/markdown-editor
      markdown=markdown
      mode="visual"
    }}`);

    const markdownToHtml = findAll('.one-markdown-to-html');
    expect(markdownToHtml).to.have.length(1);
    const h1 = markdownToHtml[0].querySelectorAll('h1');
    expect(h1).to.have.length(1);
    expect(h1[0]).to.have.trimmed.text('hello world');
  });

  it('renders textarea that render Markdown source in "markdown" mode', async function () {
    this.set('markdown', '# hello world');

    await render(hbs `{{share-show/markdown-editor
      markdown=markdown
      mode="markdown"
    }}`);

    const textarea = findAll('textarea.textarea-source-editor');
    expect(textarea).to.have.length(1);
    expect(textarea[0]).to.have.value(this.get('markdown'));
  });

  it('renders textarea that emits edited code in "markdown" mode on change', async function () {
    const onMarkdownChangeSpy = sinon.spy();
    this.set('onMarkdownChange', onMarkdownChangeSpy);
    await render(hbs `{{share-show/markdown-editor
      markdown=""
      onMarkdownChange=(action onMarkdownChange)
      mode="markdown"
    }}`);

    await fillIn('textarea.textarea-source-editor', 'hello');
    expect(onMarkdownChangeSpy).to.be.calledOnce;
    expect(onMarkdownChangeSpy).to.be.calledWith('hello');
  });
});
