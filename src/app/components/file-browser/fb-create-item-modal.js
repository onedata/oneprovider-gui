import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { isEmpty } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { next } from '@ember/runloop';

// FIXME: validate to disallow / names

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbCreateItemModal',

  store: service(),

  /**
   * @virtual
   * If true, the modal will open
   * @type {boolean}
   */
  open: false,

  /**
   * @virtual optional
   * One of: dir, file - File type to create with this modal
   * @type {string}
   */
  itemType: 'dir',

  /**
   * @virtual
   * Parent dir for newly created dir/file
   * @type {models/File}
   */
  parentDir: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   * @param {boolean} isCreated
   * @param {submitResult}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   * @param {result}
   */
  onFinish: notImplementedIgnore,

  /**
   * Stores current value of input
   * @type {string}
   */
  editValue: '',

  /**
   * @type {ComputedProperty<boolean>}
   */
  submitDisabled: isEmpty('editValue'),

  actions: {
    onHide() {
      return this.get('onHide')(false);
    },
    onHidden() {
      this.setProperties({
        editValue: '',
      });
    },
    onShown() {
      next(() => {
        if (this.get('open')) {
          this.$('.new-item-name').focus();
        }
      });
    },
    submit() {
      const {
        store,
        editValue,
        itemType,
        submitDisabled,
        parentDir,
        onHide,
      } = this.getProperties(
        'store',
        'editValue',
        'submitDisabled',
        'itemType',
        'parentDir',
        'onHide',
      );
      if (submitDisabled) {
        return;
      }
      return store
        .createRecord('file', {
          name: editValue,
          type: itemType,
          parent: parentDir,
        })
        .save()
        .catch(error => {
          // FIXME: handle errors - maybe it should be presented in backend error or the same modal
          throw error;
        })
        .then(file => onHide.bind(this)(true, file));
    },
  },
});
