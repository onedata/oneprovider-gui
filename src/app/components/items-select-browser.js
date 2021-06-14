import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { or, not, lt } from 'ember-awesome-macros';
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
  selectorModel: undefined,

  /**
   * @virtual
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   */
  onSubmit: notImplementedIgnore,

  /**
   * @virtual optional
   */
  parentModalDialogSelector: undefined,

  _document: document,

  validationError: reads('selectorModel.validationError'),

  dirId: reads('selectorModel.dirId'),

  dirProxy: reads('selectorModel.dirProxy'),

  dir: reads('selectorModel.dir'),

  space: reads('selectorModel.space'),

  initialRequiredDataProxy: reads('selectorModel.initialRequiredDataProxy'),

  browserSelectedItems: reads('selectorModel.browserSelectedItems'),

  selectorSelectedItems: reads('selectorModel.selectorSelectedItems'),

  browserModel: reads('selectorModel.browserModel'),

  /**
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('space.privileges'),

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
  }),

  contentScroll: computed('modalBodyId', function contentScroll() {
    const {
      _document,
      modalBodyId,
    } = this.getProperties('_document', 'modalBodyId');
    return _document.querySelector(`#${modalBodyId} .bs-modal-body-scroll`);
  }),

  noItemSelected: or(
    not('selectorSelectedItems.length'),
    lt('selectorSelectedItems.length', 1)
  ),

  submitDisabled: or(
    'noItemSelected',
    'validationError',
  ),

  submitSingleItem(item) {
    return this.get('onSubmit')([item]);
  },

  init() {
    this._super(...arguments);
    const selectorModel = this.get('selectorModel');
    if (!selectorModel) {
      throw new Error(
        'compontnt:items-select-browser#init: selectorModel is not provided'
      );
    }
    set(selectorModel, 'itemsSelectBrowser', this);
  },

  actions: {
    cancel() {
      this.get('onCancel')();
    },
    submit() {
      const {
        onSubmit,
        selectorSelectedItems,
      } = this.getProperties('onSubmit', 'selectorSelectedItems');
      return onSubmit(selectorSelectedItems);
    },
    updateDirEntityId(dirId) {
      this.get('selectorModel').setDirId(dirId);
    },
    changeSelectedItems(items) {
      this.get('selectorModel').setSelectedItems(items);
    },
    fetchChildren(...args) {
      const selectorModel = this.get('selectorModel');
      return get(selectorModel, 'fetchChildren').call(selectorModel, ...args);
    },
  },
});
