/**
 * Asks to download a file in mobile mode
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { notEmpty, raw, eq } from 'ember-awesome-macros';
import { LegacyFileType } from 'onedata-gui-common/utils/file';

export default Component.extend(I18n, {
  i18n: service(),

  open: notEmpty('file'),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbDownloadModal',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   * @returns {Promise}
   */
  confirmDownload: notImplementedReject,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  effFile: reads('file.effFile'),

  effFileType: reads('effFile.type'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isDirectory: eq('effFileType', raw(LegacyFileType.Directory)),

  actions: {
    close() {
      return this.get('onHide')();
    },
    download() {
      const {
        confirmDownload,
        onHide,
      } = this.getProperties('confirmDownload', 'onHide');
      return confirmDownload().finally(() => onHide());
    },
  },
});
