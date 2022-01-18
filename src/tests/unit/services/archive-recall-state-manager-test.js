import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import sinon from 'sinon';
import { get } from '@ember/object';

class WatcherMock {
  start() {}
  destroy() {}
}

describe('Unit | service | archive recall state manager', function () {
  setupTest('service:archive-recall-state-manager', {});

  beforeEach(function () {
    this.service = this.subject();
    this.createWatcherObjectStub = sinon.stub(this.service, 'createWatcherObject')
      .returns(new WatcherMock());
  });

  it('initializes single recall watcher for multiple requests with single id', function () {
    const fileId = 'file_id';

    this.service.watchRecall(fileId);
    this.service.watchRecall(fileId);
    this.service.watchRecall(fileId);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(this.createWatcherObjectStub).to.have.been.calledOnce;
    expect(this.createWatcherObjectStub).to.have.been.calledWith(fileId);
    expect(watchersRegistry).to.be.a('map').that.has.key(fileId);
    expect(watchersRegistry).to.have.lengthOf(1);
  });

  it('initializes separate recall watchers for multiple requests with various ids', function () {
    const fileId1 = 'file_id1';
    const fileId2 = 'file_id2';
    const fileId3 = 'file_id3';

    this.service.watchRecall(fileId1);
    this.service.watchRecall(fileId2);
    this.service.watchRecall(fileId3);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(this.createWatcherObjectStub).to.have.been.calledThrice;
    [fileId1, fileId2, fileId3].forEach(fileId => {
      expect(this.createWatcherObjectStub).to.have.been.calledWith(fileId);
    });
    expect(watchersRegistry).to.be.a('map').that.has.keys(fileId2, fileId2, fileId3);
    expect(watchersRegistry).to.have.lengthOf(3);
  });

  it('does not remove recall watcher if watch was requested more times than unwatch', function () {
    const fileId = 'file_id';

    this.service.watchRecall(fileId);
    this.service.watchRecall(fileId);

    this.service.unwatchRecall(fileId);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(watchersRegistry).to.be.a('map').that.has.key(fileId);
    expect(watchersRegistry).to.have.lengthOf(1);
  });

  it('removes recall watcher if unwatch was requested same times as watch', function () {
    const fileId = 'file_id';

    this.service.watchRecall(fileId);
    this.service.watchRecall(fileId);

    this.service.unwatchRecall(fileId);
    this.service.unwatchRecall(fileId);

    const watchersRegistry = get(this.service, 'watchersRegistry');
    expect(watchersRegistry).to.be.a('map').that.does.not.have.key(fileId);
    expect(watchersRegistry).to.have.lengthOf(0);
  });

  it('calls destroy on watcher when removing watcher from registry', function () {
    const fileId = 'file_id';
    this.createWatcherObjectStub.reset();
    const destroyWatcherStub = sinon.stub();
    const fakeWatcher = {
      start() {},
      destroy: destroyWatcherStub,
    };
    this.createWatcherObjectStub.returns(fakeWatcher);

    this.service.watchRecall(fileId);
    this.service.unwatchRecall(fileId);

    expect(destroyWatcherStub).to.be.calledOnce;
  });

  it('calls start on watcher when adding watcher to registry', function () {
    const fileId = 'file_id';
    this.createWatcherObjectStub.reset();
    const startWatcherStub = sinon.stub();
    const fakeWatcher = {
      start: startWatcherStub,
      destroy() {},
    };
    this.createWatcherObjectStub.returns(fakeWatcher);

    this.service.watchRecall(fileId);
    this.service.unwatchRecall(fileId);

    expect(startWatcherStub).to.be.calledOnce;
  });
});
