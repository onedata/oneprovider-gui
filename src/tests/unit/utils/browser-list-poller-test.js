import { expect } from 'chai';
import { beforeEach, afterEach, describe, it } from 'mocha';
import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import sinon from 'sinon';
import { settled } from '@ember/test-helpers';

describe('Unit | Utility | browser-list-poller', function () {
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

  it('invokes reloadList in intervals if browserModel has polling enabled', async function () {
    const poll = sinon.spy();
    const pollInterval = 1000;
    this.browserListWatcher = BrowserListPoller
      .create({
        poll,
        pollInterval,
        browserModel: createBrowserModel({ isListPollingEnabled: true }),
      });

    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.callCount(1);
    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.callCount(2);
    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.callCount(3);
  });

  it('does not invoke reloadList if browserModel has polling disabled', async function () {
    const poll = sinon.spy();
    const pollInterval = 1000;
    const browserListWatcher = BrowserListPoller
      .create({
        poll,
        pollInterval,
        browserModel: createBrowserModel({ isListPollingEnabled: false }),
      });
    this.browserListWatcher = browserListWatcher;

    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.been.not.called;
    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.been.not.called;
    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.been.not.called;
  });

  it('does not invoke reloadList in interval after destroy', async function () {
    const poll = sinon.spy();
    const pollInterval = 1000;
    const browserListWatcher = BrowserListPoller
      .create({
        poll,
        pollInterval,
        browserModel: createBrowserModel({ isListPollingEnabled: true }),
      });
    this.browserListWatcher = browserListWatcher;

    this.fakeClock.tick(pollInterval + 1);
    browserListWatcher.destroy();

    expect(poll).to.have.been.calledOnce;
    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.been.calledOnce;
    this.fakeClock.tick(pollInterval + 1);
    expect(poll).to.have.been.calledOnce;
  });

  it('invokes silent refresh on browserModel in intervals if browserModel has polling enabled', async function () {
    const pollInterval = 1000;
    const browserModelMock = {
      isListPollingEnabled: true,
      refresh: sinon.spy(),
    };
    this.browserListWatcher = BrowserListPoller
      .create({
        pollInterval,
        browserModel: browserModelMock,
      });

    this.fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(1);
    this.fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(2);
    this.fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(3);
    expect(browserModelMock.refresh).to.have.been.calledWith(
      sinon.match({ silent: true })
    );
  });
});

function createBrowserModel(data) {
  return BaseBrowserModel.create(data);
}
