/**
 * Content of table cell with file from QoS audit log.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { and, promise } from 'ember-awesome-macros';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import computedFileNameHash from 'oneprovider-gui/utils/computed-file-name-hash';
import { getFileNameFromPath } from 'onedata-gui-common/utils/file';

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['cell-file'],

  fileManager: service(),
  parentAppNavigation: service(),

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

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileId: and(
    'fileCdmiObjectId',
    computedPipe('fileCdmiObjectId', cdmiObjectIdToGuid)
  ),

  /**
   * Note: does not depend on fileId changes to prevent recomputations
   * @type {ComputedProperty<PromiseObject<Models.File>>}
   */
  fileProxy: promise.object(computed(async function fileProxy() {
    const {
      fileManager,
      fileId,
    } = this.getProperties('fileManager', 'fileId');
    return fileManager.getFileById(fileId);
  })),

  /**
   * @type {PromiseObject<{name: string, href: string, className: string}>}
   */
  fileInfoProxy: promise.object(computed(
    'fileId',
    'fileProxy.name',
    async function fileNameProxy() {
      const {
        fileProxy,
        fileId,
        path,
        onGenerateFileUrl,
      } = this.getProperties(
        'fileProxy',
        'fileId',
        'path',
        'onGenerateFileUrl',
      );
      let name;
      let href;
      let className;
      // Get file name from the moment when file has been transferred, not the current
      // name, because user sees past event log entries and past paths.
      name = getFileNameFromPath(path);
      try {
        await fileProxy;
        try {
          href = onGenerateFileUrl(fileId);
        } catch (error) {
          href = null;
        }
      } catch (error) {
        name = this.t('fileNotAvailable');
        className = 'file-not-available';
      }
      return {
        name,
        href,
        className,
      };
    }
  )),

  fileInfo: computedLastProxyContent('fileInfoProxy'),

  /**
   * @type {ComputedProperty<string>}
   */
  fileNameHash: computedFileNameHash('path'),
});
