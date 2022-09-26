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
   * Should generate a full file URL.
   * @virtual
   * @type {(fileId: string) => string}
   */
  onGenerateFileUrl: undefined,

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

  fileInfoProxy: promise.object(computed(
    'fileId',
    'fileProxy.name',
    async function fileNameProxy() {
      const {
        fileProxy,
        fileId,
        onGenerateFileUrl,
      } = this.getProperties(
        'fileProxy',
        'fileId',
        'onGenerateFileUrl',
      );
      let name;
      let href;
      let className;
      try {
        const file = await fileProxy;
        name = get(file, 'name');
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
});
