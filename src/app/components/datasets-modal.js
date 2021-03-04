import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.datasetsModal',

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  isEffDataProtected: true,
  isEffMetadataProtected: true,

  inheritedDatasets: Object.freeze([{
      name: 'Chain dir 3',
      path: '/Chain dir 1/Chain dir 2/Chain dir 3',
      isDataProtected: false,
      isMetadataProtected: false,
    },

    {
      name: 'Chain dir 2',
      path: '/Chain dir 1/Chain dir 2',
      isDataProtected: true,
      isMetadataProtected: false,
    },

    {
      name: 'Chain dir 1',
      path: '/Chain dir 1',
      isDataProtected: false,
      isMetadataProtected: true,
    },
  ]),

  actions: {
    onHide() {
      this.get('onHide')();
    },
  },
});
