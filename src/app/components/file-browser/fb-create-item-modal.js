import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { isEmpty } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

// FIXME: validate to disallow empty and / names

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbCreateItemModal',

  store: service(),

  itemType: 'dir',

  parentDir: undefined,

  onHide: undefined,

  open: false,

  editValue: '',

  submitDisabled: isEmpty('editValue'),

  didInsertElement() {
    this._super(...arguments);
    this.$('.new-item-name').focus();
  },

  actions: {
    onHide() {
      return this.get('onHide')(...arguments);
    },
    onHidden() {
      this.setProperties({
        editValue: '',
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
        .then(onHide.bind(this));
    },
  },
});
