import { expect } from 'chai';
import { describe, it } from 'mocha';
import FakeListRecordRelation from 'oneprovider-gui/utils/fake-list-record-relation';
import wait from 'ember-test-helpers/wait';
import { resolve } from 'rsvp';
import { get } from '@ember/object';

describe('Unit | Utility | utils/fake list record relation', function () {
  it('requires to be created with initChunkArray', function () {
    expect(function () {
      FakeListRecordRelation.create({});
    }).to.throw();
  });

  it('has isLoading flag until initialLoad is completed', function () {
    const initChunksArray = {
      initialLoad: resolve('test'),
    };

    const relation = FakeListRecordRelation.create({
      initChunksArray,
    });

    expect(get(relation, 'isLoading'), 'isLoading before resolve')
      .to.be.true;

    return wait().then(() => {
      expect(get(relation, 'isLoading'), 'isLoading after resolve')
        .to.be.false;
    });
  });
});
