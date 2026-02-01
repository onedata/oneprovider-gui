import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { tracked } from '@glimmer/tracking';
import { lookupService } from '../../helpers/stub-service';

describe('Integration | Component | replaceable-file-info', function () {
  setupRenderingTest();

  it('renders selected file and target file names if differ', async function () {
    const helper = new Helper(this);
    const localDeviceFile = new File(['test'], 'foo.txt');
    const onedataFile = helper.createOnedataFile({ name: 'bar.txt' });
    helper.renderContext.selectedFile = localDeviceFile;
    helper.renderContext.targetFile = onedataFile;

    await helper.render();

    const element = helper.getElement();

    expect(element.querySelector('.selected-file-name').textContent.trim())
      .to.equal(localDeviceFile.name);
    expect(element.querySelector('.target-file-name').textContent.trim())
      .to.equal(onedataFile.name);
  });

  it('renders only single name if selected and target names equal', async function () {
    const helper = new Helper(this);
    const commonName = 'foo.txt';
    const localDeviceFile = new File(['test'], commonName);
    const onedataFile = helper.createOnedataFile({ name: commonName });
    helper.renderContext.selectedFile = localDeviceFile;
    helper.renderContext.targetFile = onedataFile;

    await helper.render();

    const element = helper.getElement();

    expect(element.querySelector('.selected-file-name')).to.not.exist;
    expect(element.querySelector('.file-base-name').textContent.trim())
      .to.equal(commonName);
  });
});

class RenderContext {
  @tracked selectedFile;
  @tracked targetFile;
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

  get store() {
    return lookupService(this.mochaContext, 'store');
  }

  getElement() {
    return this.mochaContext.element.querySelector('.replaceable-file-info');
  }

  createOnedataFile(data) {
    return this.store.createRecord('file', data);
  }

  async render() {
    this.mochaContext.set('ctx', this.renderContext);
    await render(hbs`<ReplaceableFileInfo
      @selectedFile={{this.ctx.selectedFile}}
      @targetFile={{this.ctx.targetFile}}
      @placeholder={{this.ctx.placeholder}}
    />`);
  }
}
