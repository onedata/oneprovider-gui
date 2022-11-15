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
   * @virtual
   * @type {Object<string, string>}
   */
  entryHashMapping: undefined,

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
        // FIXME: nazwa tutaj będzie aktualna, natomiast ścieżka będzie stara
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

  // FIXME: DRY?
  fileNameHash: computed(
    'path',
    // FIXME: add property
    'duplicateNameHashGenerator.hashMapping',
    function fileNameHash() {
      const hashMapping = this.duplicateNameHashGenerator.hashMapping;
      console.log('FIXME: fileNameHash recomputed', this.path, hashMapping[this.path], hashMapping);
      // debugger;
      if (!this.path) {
        return '';
      }
      const hash = hashMapping[this.path];
      return hash ? ('#' + hash) : '';
    }
  ),
});
