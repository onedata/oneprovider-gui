import { expect } from 'chai';
import { beforeEach, afterEach, describe, it } from 'mocha';
import ArchiveFilesystemBrowserListPoller from 'oneprovider-gui/utils/archive-filesystem-browser-list-poller';
import sinon from 'sinon';
import { settled } from '@ember/test-helpers';

describe('Unit | Utility | archive-filesystem-browser-list-poller', function () {
  beforeEach(function () {
    this.fakeClock = sinon.useFakeTimers({
      now: Date.now(),
      shouldAdvanceTime: true,
    });
  });

  afterEach(function () {
    this.fakeClock.restore();
    this.browserListWatcher?.destroy();
  });

  it('invokes refresh and archive reload in intervals if browerModel has polling enabled', async function () {
    const archiveMock = {
      reload: sinon.spy(),
    };
    const browserModelMock = {
      archive: archiveMock,
      refresh: sinon.spy(),
      isListPollingEnabled: true,
    };
    this.browserListPoller = ArchiveFilesystemBrowserListPoller
      .create({
        browserModel: browserModelMock,
      });
    const pollInterval = this.browserListPoller.pollInterval;

    this.fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(1);
    expect(archiveMock.reload).to.have.callCount(1);
    this.fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(2);
    expect(archiveMock.reload).to.have.callCount(2);
    this.fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(3);
    expect(archiveMock.reload).to.have.callCount(3);
  });
});
