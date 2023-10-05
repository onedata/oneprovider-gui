import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import sinon from 'sinon';
import { get } from '@ember/object';
import { lookupService } from '../../helpers/stub-service';
import clearStoreAfterEach from '../../helpers/clear-store';

class WatcherMock {
  start() {}
  destroy() {}
}

describe('Unit | service | archive-recall-state-manager', function () {
  setupTest();
  clearStoreAfterEach();

  beforeEach(function () {
    this.service = this.owner.lookup('service:archive-recall-state-manager');
    this.createWatcherObjectStub = sinon.stub(this.service, 'createWatcherObject')
      .returns(new WatcherMock());
  });

  it('initializes single recall watcher for multiple requests with single recallRootId', function () {
    const recallRootId = '123';
    const file1 = { recallRootId };
    const file2 = { recallRootId };
    const file3 = { recallRootId };

    this.service.watchRecall(file1);
    this.service.watchRecall(file2);
    this.service.watchRecall(file3);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(this.createWatcherObjectStub).to.have.been.calledOnce;
    expect(this.createWatcherObjectStub).to.have.been.calledWith(file1);
    expect(watchersRegistry).to.be.a('map').that.has.key(recallRootId);
    expect(watchersRegistry).to.have.lengthOf(1);
  });

  it('initializes separate recall watchers for multiple requests with various ids', function () {
    const file1 = { recallRootId: 'rr1' };
    const file2 = { recallRootId: 'rr2' };
    const file3 = { recallRootId: 'rr3' };

    this.service.watchRecall(file1);
    this.service.watchRecall(file2);
    this.service.watchRecall(file3);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(this.createWatcherObjectStub).to.have.been.calledThrice;
    [file1, file2, file3].forEach(file => {
      expect(this.createWatcherObjectStub).to.have.been.calledWith(file);
    });
    expect(watchersRegistry).to.be.a('map').that.has.keys('rr1', 'rr2', 'rr3');
    expect(watchersRegistry).to.have.lengthOf(3);
  });

  it('does not remove recall watcher if not all generated watch tokens were used to unwatch', function () {
    const file = { recallRootId: 'rr1' };

    const token1 = this.service.watchRecall(file);
    this.service.watchRecall(file);
    this.service.unwatchRecall(file, token1);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(watchersRegistry).to.be.a('map').that.has.key('rr1');
    expect(watchersRegistry).to.have.lengthOf(1);
  });

  it('removes recall watcher if all generated tokens were used to unwatch for single file', function () {
    const file = { recallRootId: 'rr1' };

    const token1 = this.service.watchRecall(file);
    const token2 = this.service.watchRecall(file);

    this.service.unwatchRecall(file, token1);
    this.service.unwatchRecall(file, token2);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(watchersRegistry).to.have.lengthOf(0);
  });

  it('calls destroy on watcher when removing watcher from registry', function () {
    const file = { recallRootId: 'rr1' };
    this.createWatcherObjectStub.reset();
    const destroyWatcherStub = sinon.stub();
    const fakeWatcher = Object.assign(new WatcherMock(), {
      destroy: destroyWatcherStub,
    });
    this.createWatcherObjectStub.returns(fakeWatcher);

    const token = this.service.watchRecall(file);
    this.service.unwatchRecall(file, token);

    expect(destroyWatcherStub).to.be.calledOnce;
  });

  it('calls start on watcher when adding watcher to registry', function () {
    const file = { recallRootId: 'rr1' };
    this.createWatcherObjectStub.reset();
    const startWatcherStub = sinon.stub();
    const fakeWatcher = Object.assign(new WatcherMock(), {
      start: startWatcherStub,
    });
    this.createWatcherObjectStub.returns(fakeWatcher);

    const token = this.service.watchRecall(file);
    this.service.unwatchRecall(file, token);

    expect(startWatcherStub).to.be.calledOnce;
  });

  it('throws error in test environment if file does not have recallRootId', async function () {
    const store = lookupService(this, 'store');
    const file1 = store.createRecord('file', {});

    let catchedError;
    try {
      this.service.watchRecall(file1);
    } catch (error) {
      catchedError = error;
    }

    expect(catchedError).to.be.ok;
    expect(String(catchedError)).to.match(/Tried to invoke "watchRecall"/);
  });

  it('does not throw error in if "areWarningsFatal" is false if file does not have recallRootId',
    async function () {
      const store = lookupService(this, 'store');
      const file1 = store.createRecord('file', {});
      this.service.set('areWarningsFatal', false);

      let catchedError;
      let methodResult;
      try {
        methodResult = this.service.watchRecall(file1);
      } catch (error) {
        catchedError = error;
      }

      expect(catchedError).to.be.undefined;
      expect(methodResult).to.be.undefined;
    });
});
