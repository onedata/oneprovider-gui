import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import { clearStoreAfterEach } from '../../helpers/clear-store';
import { all as allFulfilled } from 'rsvp';

describe('Unit | Model | file', function () {
  setupTest();
  clearStoreAfterEach();

  it('changes sharesCount when shareRecords changes', async function () {
    const store = this.owner.lookup('service:store');
    const share1 = store.createRecord('share', {});
    const share2 = store.createRecord('share', {});
    await allFulfilled([share1.save(), share2.save()]);
    const file = store.createRecord('file', {
      shareRecords: [share1],
    });
    await file.save();

    expect(file.get('sharesCount')).to.equal(1);
    file.set('shareRecords', [share1, share2]);

    expect(file.get('sharesCount')).to.equal(2);
  });
});
