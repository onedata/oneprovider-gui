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
    this.ownerSource = {};
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
    this.set('archiveRecallInfo.startTimestamp', 1000);
    this.set('archiveRecallInfo.finishTimestamp', 2000);

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
      ownerSource: this,
    });
    const reloadStateSpy = sinon.spy(this.watcher, 'reloadState');
    const stopSpy = sinon.spy(this.watcher, 'stop');
    this.set('archiveRecallInfo.startTimestamp', 1000);
    this.set('archiveRecallInfo.finishTimestamp', null);
    this.set('archiveRecallState.currentBytes', 0);
    this.set('archiveRecallState.currentFiles', 0);

    this.watcher.start();
    this.clock.tick(1);
    expect(reloadStateSpy).to.have.been.calledOnce;
    this.clock.tick(interval + 1);
    expect(reloadStateSpy).to.have.been.calledTwice;
    this.clock.tick(interval + 1);
    expect(reloadStateSpy).to.have.been.calledThrice;
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles')
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
      ownerSource: this,
    });
    const reloadInfoSpy = sinon.spy(this.watcher, 'reloadInfo');
    this.set('archiveRecallInfo.startTimestamp', 1000);
    this.set('archiveRecallInfo.finishTimestamp', null);
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes') / 2
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles') / 2
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
      ownerSource: this,
    });
    const reloadInfoSpy = sinon.spy(this.watcher, 'reloadInfo');
    this.set('archiveRecallInfo.startTimestamp', 1000);
    this.set('archiveRecallInfo.finishTimestamp', null);
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes')
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles')
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
      ownerSource: this,
    });
    const stopSpy = sinon.spy(this.watcher, 'stop');
    this.set('archiveRecallInfo.startTimestamp', 1000);
    this.set('archiveRecallInfo.finishTimestamp', null);

    this.watcher.start();
    this.clock.tick(1);
    expect(get(this.watcher, 'looper')).to.be.not.null;
    const looperDestroySpy = sinon.spy(get(this.watcher, 'looper'), 'destroy');
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes')
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles')
    );
    this.clock.tick(interval + 1);
    expect(stopSpy).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.be.false;
    expect(get(this.watcher, 'looper')).to.be.null;
    expect(looperDestroySpy).to.have.been.calledOnce;
  });

  it('stops polling for state and starts for info when reloading state fails because of notFound until finishTimestamp is non-empty',
    async function () {
      const interval = 1000;
      this.watcher = ArchiveRecallStateWatcher.create({
        interval,
        targetFile: this.get('targetFile'),
        ownerSource: this,
      });
      const reloadInfoStub = sinon.stub(this.watcher, 'reloadInfo');
      const reloadStateStub = sinon.stub(this.watcher, 'reloadState');
      reloadStateStub.rejects(new Error({ id: 'notFound' }));
      this.set('archiveRecallInfo.startTimestamp', 1000);
      this.set('archiveRecallInfo.finishTimestamp', null);

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
      this.set('archiveRecallInfo.finishTimestamp', 2000);
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
      ownerSource: this,
    });
    const getInfoStub = sinon.stub(this.watcher, 'getInfo');
    getInfoStub.rejects(new Error('get info reject mock'));
    this.set('archiveRecallInfo.startTimestamp', 1000);
    this.set('archiveRecallInfo.finishTimestamp', null);

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
      ownerSource: this,
    });
    const reloadInfoStub = sinon.stub(this.watcher, 'reloadInfo');
    reloadInfoStub.rejects(new Error('reload info reject mock'));
    this.set('archiveRecallInfo.startTimestamp', null);
    this.set('archiveRecallInfo.finishTimestamp', null);
    this.set(
      'archiveRecallState.currentBytes',
      this.get('archiveRecallInfo.targetBytes')
    );
    this.set(
      'archiveRecallState.currentFiles',
      this.get('archiveRecallInfo.targetFiles')
    );

    this.watcher.start();
    this.clock.tick(1);

    expect(reloadInfoStub).to.have.been.calledOnce;
    expect(get(this.watcher, 'isPolling')).to.be.false;
  });

  it('updates info if sum of succeeded and failed files equals total files',
    async function () {
      const interval = 1000;
      this.watcher = ArchiveRecallStateWatcher.create({
        interval,
        targetFile: this.get('targetFile'),
        ownerSource: this,
      });
      const currentFiles = 70;
      const failedFiles = 30;
      const targetFiles = currentFiles + failedFiles;
      const reloadInfoSpy = sinon.spy(this.watcher, 'reloadInfo');
      this.set('archiveRecallInfo.startTimestamp', 1000);
      this.set('archiveRecallInfo.finishTimestamp', null);
      this.set('archiveRecallInfo.targetFiles', targetFiles);
      this.set('archiveRecallState.currentFiles', currentFiles);
      this.set('archiveRecallState.failedFiles', failedFiles);

      this.watcher.start();
      this.clock.tick(1);

      expect(reloadInfoSpy).to.have.been.calledOnce;
    }
  );
});
