/**
 * Component for managing properties of archive or create archives.
 * Needs modal-like for layout rendering.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { set } from '@ember/object';

export default Component.extend(I18n, {
  classNames: ['archive-properties'],
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveProperties',

  /**
   * @virtual
   * @type {Utils.ArchivePropertiesViewModel}
   */
  viewModel: undefined,

  /**
   * @override
   */
  didInsertElement() {
    set(this.viewModel, 'element', this.element);
  },
  actions: {
    discard() {
      this.viewModel.discard();
    },
    async submit() {
      this.viewModel.submit();
    },
  },
});
