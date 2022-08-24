import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import Helper from '../../../helpers/file-permissions';

describe('Integration | Component | file-permissions/footer', function () {
  setupRenderingTest();

  it('renders discard and save buttons with labels', async function () {
    const helper = new Helper(this);
    await helper.givenSingleFilePosix();

    await helper.renderAll();

    expect(helper.getDiscardButton()).to.exist;
    expect(helper.getDiscardButton()).to.contain.text('Discard changes');
    expect(helper.getSaveButton()).to.exist;
    expect(helper.getSaveButton()).to.contain.text('Save');
  });

  it('renders discard and save buttons as disabled when is not modified', async function () {
    const helper = new Helper(this);
    await helper.givenSingleFilePosix();

    await helper.renderAll();

    expect(helper.getDiscardButton()).to.exist;
    expect(helper.getDiscardButton()).to.have.attr('disabled');
    expect(helper.getSaveButton()).to.exist;
    expect(helper.getSaveButton()).to.have.attr('disabled');
  });
});
