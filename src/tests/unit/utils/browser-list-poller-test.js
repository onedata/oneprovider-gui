import { expect } from 'chai';
import { beforeEach, afterEach, describe, it } from 'mocha';
import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import sinon from 'sinon';
import FakeTimers from '@sinonjs/fake-timers';
import { settled } from '@ember/test-helpers';

describe('Unit | Utility | browser-list-poller', function () {
  beforeEach(function () {
    this.fakeClock = FakeTimers.install();
  });

  afterEach(function () {
    this.fakeClock?.uninstall();
    this.browserListPoller?.destroy();
  });

  it('invokes poll in intervals if browserModel has polling enabled', async function () {
    const executePoll = sinon.spy();
    const pollInterval = 1000;
    this.browserListPoller = BrowserListPoller
      .create({
        executePoll,
        pollInterval,
        browserModel: createBrowserModel({ isListPollingEnabled: true }),
      });

    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.callCount(1);
    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.callCount(2);
    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.callCount(3);
  });

  it('does not invoke reloadList if browserModel has polling disabled', async function () {
    const executePoll = sinon.spy();
    const pollInterval = 1000;
    const browserListPoller = BrowserListPoller
      .create({
        executePoll,
        pollInterval,
        browserModel: createBrowserModel({ isListPollingEnabled: false }),
      });
    this.browserListPoller = browserListPoller;

    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.not.called;
    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.not.called;
    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.not.called;
  });

  it('does not invoke reloadList in interval after destroy', async function () {
    const executePoll = sinon.spy();
    const pollInterval = 1000;
    const browserListPoller = BrowserListPoller
      .create({
        executePoll,
        pollInterval,
        browserModel: createBrowserModel({ isListPollingEnabled: true }),
      });
    this.browserListPoller = browserListPoller;

    this.fakeClock.tick(pollInterval + 1);
    browserListPoller.destroy();

    expect(executePoll).to.have.been.calledOnce;
    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.calledOnce;
    this.fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.calledOnce;
  });

  it('invokes silent refresh on browserModel in intervals if browserModel has polling enabled', async function () {
    const pollInterval = 1000;
    const browserModelMock = {
      isListPollingEnabled: true,
      refresh: sinon.spy(),
    };
    this.browserListPoller = BrowserListPoller
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
  return {
    async refresh() {},
    selectedItemsOutOfScope: false,
    ...data,
  };
}
