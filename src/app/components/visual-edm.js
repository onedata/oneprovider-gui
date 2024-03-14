import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: [
    'visual-edm',
  ],
  classNameBindings: [
    'viewModel.model.isReadOnly:readonly',
  ],

  i18nPrefix: 'components.visualEdm',

  /**
   * FIXME: proper type
   * @type {Utils.EdmViewModel}
   * @virtual
   */
  viewModel: undefined,

  init() {
    this._super(...arguments);
    // FIXME: debug code
    ((name) => {
      window[name] = this;
      console.log(`window.${name}`, window[name]);
    })('debug_visual_edm');
  },
});
