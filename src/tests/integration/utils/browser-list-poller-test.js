import { expect } from 'chai';
import { describe, it } from 'mocha';
import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import sinon from 'sinon';
import FakeTimers from '@sinonjs/fake-timers';
import { settled } from '@ember/test-helpers';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import EmberObject from '@ember/object';
import { setupRenderingTest } from 'ember-mocha';

describe('Integration | Utility | browser-list-poller', function () {
  const { beforeEach, afterEach } = setupRenderingTest();

  beforeEach(function () {
    this.set('fakeClock', FakeTimers.install());
  });

  afterEach(function () {
    this.get('fakeClock')?.uninstall();
    this.browserListPoller?.destroy();
  });

  it('invokes poll in intervals if browserModel has polling enabled', async function () {
    const executePoll = sinon.spy();
    const pollInterval = 1000;
    this.browserListPoller = BrowserListPoller
      .create({
        executePoll,
        pollInterval,
        browserModel: createBrowserModel(this, { isListPollingEnabled: true }),
      });
    const fakeClock = this.get('fakeClock');

    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.callCount(1);
    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.callCount(2);
    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.callCount(3);
  });

  it('does not invoke reloadList if browserModel has polling disabled', async function () {
    const executePoll = sinon.spy();
    const pollInterval = 1000;
    const browserListPoller = BrowserListPoller
      .create({
        executePoll,
        pollInterval,
        browserModel: createBrowserModel(this, { isListPollingEnabled: false }),
      });
    this.browserListPoller = browserListPoller;
    const fakeClock = this.get('fakeClock');

    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.not.called;
    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.not.called;
    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.not.called;
  });

  it('does not invoke reloadList in interval after destroy', async function () {
    const executePoll = sinon.spy();
    const pollInterval = 1000;
    const browserListPoller = BrowserListPoller
      .create({
        executePoll,
        pollInterval,
        browserModel: createBrowserModel(this, { isListPollingEnabled: true }),
      });
    this.browserListPoller = browserListPoller;
    const fakeClock = this.get('fakeClock');

    fakeClock.tick(pollInterval + 1);
    browserListPoller.destroy();

    expect(executePoll).to.have.been.calledOnce;
    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.calledOnce;
    fakeClock.tick(pollInterval + 1);
    expect(executePoll).to.have.been.calledOnce;
  });

  it('invokes silent refresh on browserModel in intervals if browserModel has polling enabled', async function () {
    const pollInterval = 1000;
    const browserModelMock = createBrowserModel(this, {
      isListPollingEnabled: true,
      refresh: sinon.spy(),
    });
    this.browserListPoller = BrowserListPoller
      .create({
        pollInterval,
        browserModel: browserModelMock,
      });
    const fakeClock = this.get('fakeClock');

    fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(1);
    fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(2);
    fakeClock.tick(pollInterval + 1);
    await settled();
    expect(browserModelMock.refresh).to.have.callCount(3);
    expect(browserModelMock.refresh).to.have.been.calledWith(
      sinon.match({ silent: true })
    );
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
