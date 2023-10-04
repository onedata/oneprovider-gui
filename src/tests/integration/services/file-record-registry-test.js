import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { lookupService } from '../../helpers/stub-service';
import { all as allFulfilled } from 'rsvp';
import _ from 'lodash';
import { clearStoreAfterEach } from '../../helpers/clear-store';
import { get } from '@ember/object';

describe('Integration | Service | file-record-registry', function () {
  setupRenderingTest();
  clearStoreAfterEach();

  it('returns registered file records', async function () {
    const fileRecordRegistry = lookupService(this, 'file-record-registry');
    const store = lookupService(this, 'store');
    const files = await allFulfilled(
      _.range(3).map(i => store.createRecord('file', { name: `file-${i}` }).save())
    );
    const fileGris = files.map(file => file.get('id'));
    const consumer1 = {};
    const consumer2 = {};

    fileRecordRegistry.setFileGris(consumer1, fileGris[0], fileGris[1]);
    fileRecordRegistry.setFileGris(consumer2, fileGris[2]);

    const registeredFiles = fileRecordRegistry.getRegisteredFiles();
    expect([...registeredFiles.values()].sort()).to.deep.equal([...files].sort());
  });

  it('returns file records after deregister if there are still consumers for them', async function () {
    const fileRecordRegistry = lookupService(this, 'file-record-registry');
    const store = lookupService(this, 'store');
    const files = await allFulfilled(
      _.range(2).map(i => store.createRecord('file', { name: `file-${i}` }).save())
    );
    const fileGris = files.map(file => file.get('id'));
    const consumer1 = {};
    const consumer2 = {};

    fileRecordRegistry.setFileGris(consumer1, fileGris[0]);
    fileRecordRegistry.setFileGris(consumer2, fileGris[0]);
    fileRecordRegistry.deregisterFileGris(consumer2, fileGris[0]);

    const registeredFiles = fileRecordRegistry.getRegisteredFiles();
    expect([...registeredFiles.values()]).to.deep.equal([files[0]]);
  });

  it('does not return file records after deregister if there are no consumers left for them', async function () {
    const fileRecordRegistry = lookupService(this, 'file-record-registry');
    const store = lookupService(this, 'store');
    const files = await allFulfilled(
      _.range(2).map(i => store.createRecord('file', { name: `file-${i}` }).save())
    );
    const fileGris = files.map(file => file.get('id'));
    const consumer1 = {};
    const consumer2 = {};

    fileRecordRegistry.setFileGris(consumer1, fileGris[0], fileGris[1]);
    fileRecordRegistry.setFileGris(consumer2, fileGris[0]);
    fileRecordRegistry.deregisterFileGris(consumer1, fileGris[0]);
    fileRecordRegistry.deregisterFileGris(consumer2, fileGris[0]);

    const registeredFiles = fileRecordRegistry.getRegisteredFiles();
    expect([...registeredFiles.values()]).to.deep.equal([files[1]]);
  });

  it('remove all consumer references from files if deregister is invoked without files', async function () {
    const fileRecordRegistry = lookupService(this, 'file-record-registry');
    const store = lookupService(this, 'store');
    const files = await allFulfilled(
      _.range(4).map(i => store.createRecord('file', { name: `file-${i}` }).save())
    );
    const fileGris = files.map(file => get(file, 'id'));
    const consumer1 = {};
    const consumer2 = {};

    fileRecordRegistry.setFileGris(consumer1, fileGris[0], fileGris[1]);
    fileRecordRegistry.setFileGris(consumer2, fileGris[1], fileGris[2], fileGris[3]);
    fileRecordRegistry.deregisterFileGris(consumer2);

    const registeredFiles = fileRecordRegistry.getRegisteredFiles();
    expect([...registeredFiles.values()].sort())
      .to.deep.equal([files[0], files[1]].sort());
  });
});
