/**
 * Tests only if archive-recall component is integrated with modal and modal features.
 *
 * @module tests/integration/components/archive-recall-modal-test
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { registerService } from '../../helpers/stub-service';
import $ from 'jquery';
import sinon from 'sinon';
import { click } from 'ember-native-dom-helpers';
import wait from 'ember-test-helpers/wait';
import { mockRootFiles } from '../../helpers/files';
import { resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

const ArchiveManager = Service.extend({
  async recallArchive() {},
});

const FileManager = Service.extend(Evented, {
  async fetchDirChildren() {
    return [];
  },
  registerRefreshHandler() {},
  deregisterRefreshHandler() {},
  async checkFileNameExists() {
    return false;
  },
});

// TODO: VFS-8878 speed-up animations of overlay-modals in test environment
describe('Integration | Component | archive recall modal', function () {
  setupComponentTest('archive-recall-modal', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'fileManager', FileManager);
    registerService(this, 'archiveManager', ArchiveManager);
    this.setProperties({
      open: true,
      space: {
        entityId: 'space_id',
        currentUserIsOwner: false,
        privileges: {
          view: true,
        },
      },
    });

    const entityId = 'deid';
    const name = 'Test directory';
    const filesCount = 3;
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
    };
    const dataset = {
      name: 'dataset_name',
    };
    this.setProperties({
      dir,
      space: {
        entityId: 'space_id',
        currentUserIsOwner: false,
        privileges: {
          view: true,
        },
        rootDir: promiseObject(resolve(dir)),
      },
      archive: {
        name: 'My archive name',
        dataset: promiseObject(resolve(dataset)),
      },
    });
    mockRootFiles({
      testCase: this,
      filesCount,
    });
  });

  it('renders modal with archive name in header and invokes onHide on close', async function () {
    this.setProperties({
      onHide: sinon.spy(),
      onArchiveRecallStarted: sinon.spy(),
    });

    await render(this);

    expect($('.archive-recall-modal.in'), 'opened modal').to.exist;
    expect($('.archive-recall-modal.in .archive-recall-modal-header'), 'header').to.exist;
    expect($('.archive-recall-header .header-text').text())
      .to.contain('Recall archive into a selected directory');
    expect($('.modal-archive-subheader .file-name')).to.exist;
    expect($('.modal-archive-subheader .file-name').text()).to.contain('My archive name');
    expect(this.get('onHide')).to.have.not.been.called;
    await click('.archive-recall-modal-footer .cancel-btn');
    expect(this.get('onHide')).to.have.been.calledOnce;
  });

  it('invokes onArchiveRecallStarted and onHide on submit resolve', async function () {
    const onHide = sinon.spy();
    const onArchiveRecallStarted = sinon.spy();
    this.setProperties({
      onHide,
      onArchiveRecallStarted,
    });

    await render(this);

    await click('.archive-recall-modal-footer .submit-btn');
    await wait();
    expect(onArchiveRecallStarted, 'started').to.have.been.calledOnce;
    expect(onHide, 'hide').to.have.been.calledOnce;
  });
});

async function render(testCase) {
  testCase.render(hbs `
    {{archive-recall-modal
      open=open
      space=space
      archive=archive
      onHide=(action onHide)
      onArchiveRecallStarted=(action onArchiveRecallStarted)
    }}
  `);
  await wait();
}
