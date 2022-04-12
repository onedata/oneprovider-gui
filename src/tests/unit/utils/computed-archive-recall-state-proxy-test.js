import { expect } from 'chai';
import { describe, it } from 'mocha';
import computedArchiveRecallStateProxy from 'oneprovider-gui/utils/computed-archive-recall-state-proxy';
import EmberObject, { get, computed } from '@ember/object';
import sinon from 'sinon';
import { promise, raw } from 'ember-awesome-macros';

describe('Unit | Utility | computed archive recall state proxy', function () {
  it('rejects with custom error when using remote provider', async function () {
    const stateFetchSpy = sinon.spy();
    const testObject = EmberObject.extend({
      archiveRecallInfoProxy: promise.object(promise.resolve(raw({
        isOnLocalProvider: false,
      }))),
      internalArchiveRecallStateProxy: promise.object(computed(function () {
        stateFetchSpy();
        return {};
      })),
      archiveRecallStateProxy: computedArchiveRecallStateProxy(
        'archiveRecallInfoProxy',
        'internalArchiveRecallStateProxy',
      ),
    }).create();

    let getDone = false;
    try {
      await get(testObject, 'archiveRecallStateProxy');
      getDone = true;
    } catch (error) {
      expect(stateFetchSpy).to.not.have.been.called;
      expect(error).to.have.property('type', 'archive-recall-state-not-available');
    }
    expect(getDone).to.be.false;
  });

  it('resolves with state when using local provider', async function () {
    const expectedState = {};
    const testObject = EmberObject.extend({
      archiveRecallInfoProxy: promise.object(promise.resolve(raw({
        isOnLocalProvider: true,
      }))),
      internalArchiveRecallStateProxy: promise.object(promise.resolve(
        raw(expectedState)
      )),
      archiveRecallStateProxy: computedArchiveRecallStateProxy(
        'archiveRecallInfoProxy',
        'internalArchiveRecallStateProxy',
      ),
    }).create();

    const state = await get(testObject, 'archiveRecallStateProxy');

    expect(state).to.equal(expectedState);
  });
});
