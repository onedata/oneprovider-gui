import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { find } from '@ember/test-helpers';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import { lookupService } from '../../helpers/stub-service';
import { all as allSettled } from 'rsvp';
import { findByText } from '../../helpers/find';
import { click } from '@ember/test-helpers';
import Helper from '../../helpers/file-permissions';
import sleep from 'onedata-gui-common/utils/sleep';

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
