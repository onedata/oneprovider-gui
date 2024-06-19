import { expect } from 'chai';
import { describe, it } from 'mocha';
import ArchiveFilesystemBrowserListPoller from 'oneprovider-gui/utils/archive-filesystem-browser-list-poller';
import sinon from 'sinon';
import { settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-mocha';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import EmberObject from '@ember/object';

describe('Unit | Utility | archive-filesystem-browser-list-poller', function () {
  const { beforeEach, afterEach } = setupRenderingTest();

  beforeEach(function () {
    this.set('fakeClock', sinon.useFakeTimers({
      now: Date.now(),
      shouldAdvanceTime: true,
    }));
  });

  afterEach(function () {
    this.get('fakeClock').restore();
    this.browserListWatcher?.destroy();
    this.browserModelMock?.destroy();
  });

  it('invokes refresh and archive reload in intervals if browerModel has polling enabled', async function () {
    const archiveMock = {
      reload: sinon.spy(),
    };
    this.browserModelMock = createBrowserModel(this, {
      archive: archiveMock,
      dir: {},
      refresh: sinon.spy(),
      isListPollingEnabled: true,
    });
    this.browserListPoller = ArchiveFilesystemBrowserListPoller
      .create({
        browserModel: this.browserModelMock,
      });
    const pollInterval = this.browserListPoller.pollInterval;
    const fakeClock = this.get('fakeClock');

    fakeClock.tick(pollInterval + 1);
    await settled();
    expect(this.browserModelMock.refresh).to.have.callCount(1);
    expect(archiveMock.reload).to.have.callCount(1);
    fakeClock.tick(pollInterval + 1);
    await settled();
    expect(this.browserModelMock.refresh).to.have.callCount(2);
    expect(archiveMock.reload).to.have.callCount(2);
    fakeClock.tick(pollInterval + 1);
    await settled();
    expect(this.browserModelMock.refresh).to.have.callCount(3);
    expect(archiveMock.reload).to.have.callCount(3);
  });
});

function createBrowserModel(mochaContext, data) {
  return EmberObject
    .extend(OwnerInjector)
    .create({
      ownerSource: mochaContext.owner,

      async refresh() {},
      dir: {},
      selectedItemsOutOfScope: false,
      ...data,
    });
}
