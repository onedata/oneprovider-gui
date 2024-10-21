import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import Helper from '../../../helpers/file-permissions';

describe('Integration | Component | file-permissions/footer', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.helper?.destroy();
  });

  it('renders discard and save buttons with labels', async function () {
    this.helper = new Helper(this);
    await this.helper.givenSingleFilePosix();

    await this.helper.renderAll();

    expect(this.helper.getDiscardButton()).to.exist;
    expect(this.helper.getDiscardButton()).to.contain.text('Discard changes');
    expect(this.helper.getSaveButton()).to.exist;
    expect(this.helper.getSaveButton()).to.contain.text('Save');
  });

  it('renders discard and save buttons as disabled when is not modified', async function () {
    this.helper = new Helper(this);
    await this.helper.givenSingleFilePosix();

    await this.helper.renderAll();

    expect(this.helper.getDiscardButton()).to.exist;
    expect(this.helper.getDiscardButton()).to.have.attr('disabled');
    expect(this.helper.getSaveButton()).to.exist;
    expect(this.helper.getSaveButton()).to.have.attr('disabled');
  });
});
