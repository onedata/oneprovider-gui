import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import FilesystemModel from 'oneprovider-gui/utils/items-select-browser/filesystem-model';
import DatasetModel from 'oneprovider-gui/utils/items-select-browser/dataset-model';

export default Component.extend({
  mockBackend: service(),

  open: false,

  space: reads('mockBackend.entityRecords.space.0'),

  init() {
    this._super(...arguments);
    this.openModal('filesystem');
  },

  openModal(type) {
    this.selectorModel?.destroy();
    const space = this.get('space');
    const constraintSpec = {
      maxItems: 3,
    };
    let selectorModel;
    switch (type) {
      case 'filesystem':
        constraintSpec.allowedFileTypes = ['file', 'dir'];
        selectorModel = FilesystemModel.create({
          ownerSource: this,
          constraintSpec,
          space,
        });
        break;
      case 'dataset':
        selectorModel = DatasetModel.create({
          ownerSource: this,
          constraintSpec,
          space,
        });
        break;
    }
    this.setProperties({
      selectorModel,
      open: true,
    });
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.selectorModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    submit(selectedItems) {
      this.set('sel', selectedItems);
    },
    openModal(type) {
      this.openModal(type);
    },
    onHide() {
      this.set('open', false);
      this.selectorModel?.destroy();
      this.set('selectorModel', undefined);
    },
  },
});
