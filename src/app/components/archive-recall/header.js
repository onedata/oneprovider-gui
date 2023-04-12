/**
 * Header for archive recall component
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['archive-recall-header'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveRecall.header',

  /**
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  archive: undefined,
});
