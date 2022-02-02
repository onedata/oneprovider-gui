import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import ArchiveRecallStateWatcher from 'oneprovider-gui/utils/archive-recall-state-watcher';
import { get } from '@ember/object';
import sinon from 'sinon';
import { createArchiveRecallData } from '../../helpers/archive-recall';

describe('Integration | Utility | archive recall state watcher', function () {
  setupComponentTest('test-component', {
    integration: true,
  });

  beforeEach(async function () {
    this.clock = sinon.useFakeTimers({
      now: Date.now(),
    });
    await createArchiveRecallData(this);
  });

  afterEach(function () {
    this.clock.restore();
    if (this.watcher) {
      this.watcher.destroy();
    }
  });

  it('does not reload state and stops polling if info says it is already finished', async function () {
    this.watcher = ArchiveRecallStateWatcher.create({
      targetFile: this.get('targetFile'),
    });
    const getInfoSpy = sinon.spy(this.watcher, 'getInfo');
    const reloadStateSpy = sinon.spy(this.watcher, 'reloadState');
    const stopSpy = sinon.spy(this.watcher, 'stop');
    this.set('archiveRecallInfo.startTime', 1000);
    this.set('archiveRecallInfo.finishTime', 2000);

    this.watcher.start();
    this.clock.tick(1);

    expect(getInfoSpy).to.been.calledOnce;
    expect(reloadStateSpy).to.have.not.been.called;
    expect(stopSpy).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.equal(false);
  });

  it('polls for state until recall is not finished', async function () {
    const interval = 1000;
    this.watcher = ArchiveRecallStateWatcher.create({
      interval,
      targetFile: this.get('targetFile'),
    });
    const reloadStateSpy = sinon.spy(this.watcher, 'reloadState');
    const stopSpy = sinon.spy(this.watcher, 'stop');
    this.set('archiveRecallInfo.startTime', 1000);
    this.set('archiveRecallInfo.finishTime', null);
    this.set('archiveRecallState.bytesCopied', 0);
    this.set('archiveRecallState.filesCopied', 0);

    this.watcher.start();
    this.clock.tick(1);
    expect(reloadStateSpy).to.have.been.calledOnce;
    this.clock.tick(interval + 1);
    expect(reloadStateSpy).to.have.been.calledTwice;
    this.clock.tick(interval + 1);
    expect(reloadStateSpy).to.have.been.calledThrice;
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.clock.tick(interval + 1);
    expect(stopSpy).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.equal(false);
    reloadStateSpy.reset();
    this.clock.tick(interval + 1);
    expect(reloadStateSpy).to.have.not.been.called;
  });

  it('does not update info if state is not finished', async function () {
    const interval = 1000;
    this.watcher = ArchiveRecallStateWatcher.create({
      interval,
      targetFile: this.get('targetFile'),
    });
    const reloadInfoSpy = sinon.spy(this.watcher, 'reloadInfo');
    this.set('archiveRecallInfo.startTime', 1000);
    this.set('archiveRecallInfo.finishTime', null);
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize') / 2
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount') / 2
    );

    this.watcher.start();
    this.clock.tick(interval);
    this.clock.tick(interval);
    this.clock.tick(interval);
    this.watcher.stop();

    expect(reloadInfoSpy).to.have.not.been.called;
  });

  it('updates info when state gets finished', async function () {
    const interval = 1000;
    this.watcher = ArchiveRecallStateWatcher.create({
      interval,
      targetFile: this.get('targetFile'),
    });
    const reloadInfoSpy = sinon.spy(this.watcher, 'reloadInfo');
    this.set('archiveRecallInfo.startTime', 1000);
    this.set('archiveRecallInfo.finishTime', null);
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount')
    );

    this.watcher.start();
    this.clock.tick(1);

    expect(reloadInfoSpy).to.have.been.calledOnce;
  });

  it('destroys looper after recalling has been finished', async function () {
    const interval = 1000;
    this.watcher = ArchiveRecallStateWatcher.create({
      interval,
      targetFile: this.get('targetFile'),
    });
    const stopSpy = sinon.spy(this.watcher, 'stop');
    this.set('archiveRecallInfo.startTime', 1000);
    this.set('archiveRecallInfo.finishTime', null);

    this.watcher.start();
    this.clock.tick(1);
    expect(get(this.watcher, 'looper')).to.be.not.null;
    const looperDestroySpy = sinon.spy(get(this.watcher, 'looper'), 'destroy');
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount')
    );
    this.clock.tick(interval + 1);
    expect(stopSpy).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.be.false;
    expect(get(this.watcher, 'looper')).to.be.null;
    expect(looperDestroySpy).to.have.been.calledOnce;
  });

  it('stops polling for state and starts for info when reloading state fails because of notFound until finishTime is non-empty',
    async function () {
      const interval = 1000;
      this.watcher = ArchiveRecallStateWatcher.create({
        interval,
        targetFile: this.get('targetFile'),
      });
      const reloadInfoStub = sinon.stub(this.watcher, 'reloadInfo');
      const reloadStateStub = sinon.stub(this.watcher, 'reloadState');
      reloadStateStub.rejects(new Error({ id: 'notFound' }));
      this.set('archiveRecallInfo.startTime', 1000);
      this.set('archiveRecallInfo.finishTime', null);

      this.watcher.start();
      this.clock.tick(1);
      expect(reloadInfoStub).to.have.been.calledOnce;
      expect(reloadStateStub).to.have.been.calledOnce;

      this.clock.tick(interval + 1);
      expect(reloadInfoStub).to.have.been.calledTwice;
      this.clock.tick(interval);
      expect(reloadInfoStub).to.have.been.calledThrice;
      expect(reloadStateStub).to.have.been.calledOnce;
      expect(get(this.watcher, 'isPolling')).to.be.true;
      this.set('archiveRecallInfo.finishTime', 2000);
      this.clock.tick(interval);
      expect(get(this.watcher, 'isPolling')).to.be.false;
      this.watcher.destroy();
    }
  );

  it('stops looper when getting info fails', async function () {
    const interval = 1000;
    this.watcher = ArchiveRecallStateWatcher.create({
      interval,
      targetFile: this.get('targetFile'),
    });
    const getInfoStub = sinon.stub(this.watcher, 'getInfo');
    getInfoStub.rejects(new Error('get info reject mock'));
    this.set('archiveRecallInfo.startTime', 1000);
    this.set('archiveRecallInfo.finishTime', null);

    this.watcher.start();
    this.clock.tick(1);

    expect(getInfoStub).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.be.false;
  });

  it('stops looper when reloading info fails', async function () {
    const interval = 1000;
    this.watcher = ArchiveRecallStateWatcher.create({
      interval,
      targetFile: this.get('targetFile'),
    });
    const reloadInfoStub = sinon.stub(this.watcher, 'reloadInfo');
    reloadInfoStub.rejects(new Error('reload info reject mock'));
    this.set('archiveRecallInfo.startTime', null);
    this.set('archiveRecallInfo.finishTime', null);
    this.set(
      'archiveRecallState.bytesCopied',
      this.get('archiveRecallInfo.totalByteSize')
    );
    this.set(
      'archiveRecallState.filesCopied',
      this.get('archiveRecallInfo.totalFileCount')
    );

    this.watcher.start();
    this.clock.tick(1);

    expect(reloadInfoStub).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.be.false;
  });
});
