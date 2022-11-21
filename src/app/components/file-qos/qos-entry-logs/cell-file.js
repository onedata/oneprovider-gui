/**
 * Content of table cell with file from QoS audit log.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { and } from 'ember-awesome-macros';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import computedFileNameHash from 'oneprovider-gui/utils/computed-file-name-hash';
import { getFileNameFromPath } from 'onedata-gui-common/utils/file';
import isNewTabRequestEvent from 'onedata-gui-common/utils/is-new-tab-request-event';

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['cell-file'],

  fileManager: service(),
  parentAppNavigation: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileQos.qosEntryLogs.cellFile',

  /**
   * @virtual
   * @type {string}
   */
  fileCdmiObjectId: undefined,

  /**
   * Absolute file path.
   * @virtual
   * @type {string}
   */
  path: undefined,

  /**
   * @virtual
   * @type {Utils.DuplicateNameHashMapper}
   */
  duplicateNameHashMapper: undefined,

  /**
   * Should generate a full file URL.
   * @virtual
   * @type {(fileId: string) => string}
   */
  onGenerateFileUrl: undefined,

  /**
   * If file that logs are about is inside archive, you can provide it here to display
   * archive name in log entries path tooltip.
   * @virtual optional
   * @type {Utils.BrowsabledArchive}
   */
  parentBrowsableArchive: undefined,

  _window: window,

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileId: and(
    'fileCdmiObjectId',
    computedPipe('fileCdmiObjectId', cdmiObjectIdToGuid)
  ),

  /**
   * @type {PromiseObject<{name: string, href: string}>}
   */
  fileInfo: computed(
    'fileId',
    'path',
    'onGenerateFileUrl',
    function fileInfo() {
      const {
        fileId,
        path,
        onGenerateFileUrl,
      } = this.getProperties(
        'fileId',
        'path',
        'onGenerateFileUrl',
      );
      return {
        name: getFileNameFromPath(path),
        href: onGenerateFileUrl(fileId),
      };
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  fileNameHash: computedFileNameHash('path'),

  actions: {
    // not covering all use cases (eg. middle click, contextmenu new link open)
    fileAnchorClicked(event) {
      event.preventDefault();
      (async () => {
        try {
          await this.fileManager.getFileById(this.fileId);
          this._window.open(
            this.fileInfo.href,
            isNewTabRequestEvent(event) ? '_blank' : this.navigateTarget
          );
        } catch (error) {
          this.globalNotify.backendError(this.t('openingLocation'), error);
        }
      })();
      return false;
    },
  },
});
