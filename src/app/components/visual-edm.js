import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: [
    'visual-edm',
  ],
  classNameBindings: [
    'viewModel.isReadOnly:readonly',
  ],

  i18nPrefix: 'components.visualEdm',

  /**
   * FIXME: proper type
   * @type {Utils.VisualEdmViewModel}
   * @virtual
   */
  viewModel: undefined,

  actions: {
    addWebResource() {
      this.viewModel.addWebResource();
    },
  },
});
