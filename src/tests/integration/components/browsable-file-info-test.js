import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { tracked } from '@glimmer/tracking';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

describe('Integration | Component | browsable-file-info', function () {
  setupRenderingTest();

  it('renders a provided placeholder when the file is not provided', async function () {
    const helper = new Helper(this);
    const placeholder = 'Select or drop a file from your device';
    helper.renderContext.placeholder = placeholder;

    await helper.render();

    expect(helper.getElement().textContent).to.contain(placeholder);
  });

  it('renders provided file info', async function () {
    const helper = new Helper(this);
    const file = new File(['test'], 'hello.txt');
    helper.renderContext.file = file;
    const expectedModificationTime = dateFormat([file.lastModified / 1000], {
      format: 'dateWithMinutes',
    });

    await helper.render();

    const element = helper.getElement();

    expect(element.querySelector('.single-file-info-file-name').textContent.trim())
      .to.equal(file.name);
    expect(element.querySelector('.download-file-size').textContent.trim())
      .to.equal('4 B');
    expect(element.querySelector('.download-file-modification').textContent.trim())
      .to.equal(expectedModificationTime);
  });
});

class RenderContext {
  @tracked file;
  @tracked nameComponent;
  @tracked placeholder;
}

class Helper {
  /**
   * @param {Mocha.Context} mochaContext
   */
  constructor(mochaContext) {
    this.mochaContext = mochaContext;
    this.renderContext = new RenderContext();
  }

  getElement() {
    return this.mochaContext.element.querySelector('.browsable-file-info');
  }

  async render() {
    this.mochaContext.set('ctx', this.renderContext);
    await render(hbs`<BrowsableFileInfo
      @file={{this.ctx.file}}
      @nameComponent={{this.ctx.nameComponent}}
      @placeholder={{this.ctx.placeholder}}
    />`);
  }
}
