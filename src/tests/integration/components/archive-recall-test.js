import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { mockRootFiles } from '../../helpers/files';
import { resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import Service from '@ember/service';
import { registerService } from '../../helpers/stub-service';

const ArchiveManager = Service.extend({
  async recallArchive() {},
});

describe('Integration | Component | archive recall', function () {
  setupComponentTest('archive-recall', {
    integration: true,
  });

  beforeEach(function () {
    this.setProperties({
      onCancel: () => {},
      onArchiveRecallStarted: () => {},
    });
    registerService(this, 'archiveManager', ArchiveManager);
  });

  it('lists contents of injected directory', async function () {
    const entityId = 'deid';
    const name = 'Test directory';
    const filesCount = 3;
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
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
    });
    mockRootFiles({
      testCase: this,
      filesCount,
    });

    await render(this);

    expect(this.$('.fb-table-row')).to.have.length(filesCount);
  });
});

async function render(testCase) {
  testCase.render(hbs `
    {{#one-pseudo-modal as |modal|}}
      {{archive-recall
        modal=modal
        space=space
        archive=archive
        options=options
        onCancel=(action onCancel)
        onArchiveRecallStarted=(action onArchiveRecallStarted)
      }}
    {{/one-pseudo-modal}}
  `);
  await wait();
}
