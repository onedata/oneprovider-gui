import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import sleep from 'onedata-gui-common/utils/sleep';
import { createDummyDataset as createDataset } from 'oneprovider-gui/services/dataset-manager';
import { reject } from 'rsvp';

export default Component.extend({
  opened: true,

  mockBackend: service(),

  files: collect(
    'mockBackend.entityRecords.chainDir.4',
  ),

  file: reads('files.firstObject'),

  showPrivilege: true,

  editPrivilege: true,

  init() {
    this._super(...arguments);
    // TODO: VFS-7402 implement global mock
    const directDataset = {
      attached: false,
      protectionFlags: ['data_protection', 'metadata_protection'],
    };
    /** @type {Array} */
    const chainDirs = this.get('mockBackend.entityRecords.chainDir');
    const fileDatasetSummary = {
      // test: no direct dataset established
      // directDataset: promiseObject(resolve(null)),
      directDataset: promiseObject(resolve(directDataset)),
      effectiveDatasets: promiseArray(resolve([
        createDataset(chainDirs[1], ['data_protection']),
        createDataset(chainDirs[0], ['metadata_protection']),
        createDataset(chainDirs[2], ['data_protection', 'metadata_protection']),
      ])),
    };
    this.set('file.fileDatasetSummary', promiseObject(resolve(fileDatasetSummary)));
    this.set('file.effProtectionFlags', ['data_protection', 'metadata_protection']);

    // test: forbidden message
    // this.set('file.fileDatasetSummary', promiseObject(reject({ id: 'forbidden' })));
    // test: generic error mesage
    // this.set('file.fileDatasetSummary', promiseObject(reject({ id: 'some_error' })));
  },

  onHide() {
    console.log('onHide invoked');
  },

  getDataUrl(data) {
    console.log('getDataUrl invoked', data);
    return `http://example.com/${data.fileId}?selected=${data.selected.join(',')}`;
  },
});

function resolve(value) {
  return sleep(0).then(() => value);
}

function createDummyFile(name, parent) {
  const entityId = btoa(Math.floor(Math.random() * 10000));
  const id = `file.${entityId}.instance:private`;
  return {
    id,
    entityId,
    name,
    hasParent: Boolean(parent),
    parent: promiseObject(resolve(parent)),
  };
}
