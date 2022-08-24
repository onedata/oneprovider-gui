import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { click } from '@ember/test-helpers';
import Helper from '../../helpers/file-permissions';

describe('Integration | Component | file-permissions', function () {
  setupRenderingTest();

  it('un-disables discard and save buttons after POSIX is modified', async function () {
    const helper = new Helper(this);
    await helper.givenSingleFilePosix();

    await helper.renderAll();
    // await sleep(2000);
    await click('.user-read-checkbox');
    // await sleep(2000);

    expect(helper.getDiscardButton()).to.exist;
    expect(helper.getDiscardButton()).to.not.have.attr('disabled');
    expect(helper.getSaveButton()).to.exist;
    expect(helper.getSaveButton()).to.not.have.attr('disabled');
  });
});
