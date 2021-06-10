import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise, or, not, lt } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import SelectorFilesystemBrowserModel from 'oneprovider-gui/utils/selector-filesystem-browser-model';
import { guidFor } from '@ember/object/internals';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: '',

  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.itemsSelectBrowser',

  /**
   * @virtual
   */
  modal: undefined,

  /**
   * @virtual
   */
  mode: computed(
    'constraintSpec.itemType',
    function mode() {
      const itemType = this.get('constraintSpec.itemType');
      switch (itemType) {
        case 'fileOrDirectory':
        case 'file':
        case 'direcory':
          return 'filesystem';
        case 'dataset':
          return 'dataset';
        case 'archive':
          return 'archive';
        default:
          return 'item';
      }
    },
  ),

  /**
   * @virtual
   */
  rootItem: undefined,

  /**
   * @virtual
   */
  space: undefined,

  /**
   * @virtual
   */
  constraintSpec: undefined,

  /**
   * @virtual
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual
   */
  onSubmit: notImplementedIgnore,

  _document: document,

  selectedItems: undefined,

  /**
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('space.privileges'),

  // dirProxy: reads('space.rootDir'),

  dirProxy: promise.object(computed('space.rootDir', 'dirId', function dirProxy() {
    const {
      space,
      dirId,
    } = this.getProperties('space', 'dirId');
    if (dirId) {
      return this.get('fileManager').getFileById(dirId);
    } else {
      return get(space, 'rootDir');
    }
  })),

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

  browserModel: computed('mode', function browserModel() {
    const mode = this.get('mode');
    switch (mode) {
      case 'filesystem':
        return this.createFilesystemBrowserModel();
      default:
        throw new Error(
          `component:items-select-browser#browserModel: invalid mode "${mode}"`
        );
    }
  }),

  contentScroll: computed('modalBodyId', function contentScroll() {
    const {
      _document,
      modalBodyId,
    } = this.getProperties('_document', 'modalBodyId');
    return _document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
  }),

  noItemSelected: or(not('selectedItems.length'), lt('selectedItems.length', 1)),

  submitDisabled: or(
    'noItemSelected',
    'validationError',
  ),

  // FIXME: this can be a constraint model, that can be injected and tested separately
  validationError: computed('constraintSpec', 'mode', 'selectedItems.length', function validationError() {
    const constraintSpec = this.get('constraintSpec');
    const mode = this.get('mode');
    if (mode === 'filesystem') {
      const maxItems = constraintSpec.maxItems;
      if (maxItems && this.get('selectedItems.length') > constraintSpec.maxItems) {
        // FIXME: i18n
        return `Up to ${maxItems} items can be selected.`;
      }
      // FIXME: handle file/dir constraint
    }
  }),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
  },

  createFilesystemBrowserModel() {
    return SelectorFilesystemBrowserModel.create({
      ownerSource: this,
      openCreateNewDirectory: (parent) => this.openCreateItemModal('dir', parent),
      openRemove: this.openRemoveModal.bind(this),
      openRename: this.openRenameModal.bind(this),
      openInfo: this.openInfoModal.bind(this),
    });
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

  actions: {
    cancel() {
      this.get('onHide')();
    },
    submit() {
      const {
        onSubmit,
        selectedItems,
      } = this.get('onSubmit', 'selectedItems');
      return onSubmit(selectedItems);
    },
    updateDirEntityId(id) {
      this.set('dirId', id);
    },
  },
});
