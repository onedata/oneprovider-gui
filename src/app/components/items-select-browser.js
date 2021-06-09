import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import SelectorFilesystemBrowserModel from 'oneprovider-gui/utils/selector-filesystem-browser-model';
import { guidFor } from '@ember/object/internals';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   */
  modal: undefined,

  /**
   * @virtual
   */
  mode: undefined,

  /**
   * @virtual
   */
  rootItem: undefined,

  /**
   * @virtual
   */
  space: undefined,

  _document: document,

  selectedItems: undefined,

  /**
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('space.privileges'),

  dirProxy: reads('space.rootDir'),

  dir: computedLastProxyContent('dirProxy'),

  /**
   * NOTE: observing only space, because it should reload initial dir after whole space change
   * @type {PromiseObject<Models.File>}
   */
  initialDirProxy: computed('space', function initialDirProxy() {
    return this.get('dirProxy');
  }),

  initialRequiredDataProxy: promise.object(promise.all(
    'initialDirProxy'
  )),

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  browserModel: computed(function browserModel() {
    return SelectorFilesystemBrowserModel.create({
      ownerSource: this,
      openCreateNewDirectory: (parent) => this.openCreateItemModal('dir', parent),
      openRemove: this.openRemoveModal.bind(this),
      openRename: this.openRenameModal.bind(this),
      openInfo: this.openInfoModal.bind(this),
    });
  }),

  contentScroll: computed('modalBodyId', function contentScroll() {
    const {
      _document,
      modalBodyId,
    } = this.getProperties('_document', 'modalBodyId');
    return _document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
  }),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
  },

  openRemoveModal(files, parentDir) {
    this.setProperties({
      filesToRemove: [...files],
      removeParentDir: parentDir,
    });
  },

  closeRemoveModal(removeInvoked, results) {
    const newIds = [];
    if (removeInvoked) {
      for (const fileId in results) {
        if (get(results[fileId], 'state') === 'rejected') {
          newIds.push(fileId);
        }
      }
    }
    this.set(
      'selectedFiles',
      this.get('filesToRemove').filter(file => newIds.includes(get(file, 'entityId')))
    );
    this.setProperties({
      filesToRemove: null,
      removeParentDir: null,
    });
  },

  openRenameModal(file, parentDir) {
    this.setProperties({
      fileToRename: file,
      renameParentDir: parentDir,
    });
  },

  closeRenameModal() {
    this.setProperties({
      fileToRename: null,
      renameParentDir: null,
    });
  },

  openInfoModal(file, activeTab) {
    this.setProperties({
      fileToShowInfo: file,
      showInfoInitialTab: activeTab || 'general',
    });
  },

  closeInfoModal() {
    this.set('fileToShowInfo', null);
  },

});
