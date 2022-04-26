/**
 * Row of recall errors infinite scroll table.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import cdmiObjectIdToGuid from 'onedata-gui-common/utils/cdmi-object-id-to-guid';
import { inject as service } from '@ember/service';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import parseRecallError from 'oneprovider-gui/utils/parse-recall-error';
import { equal, raw, or, and } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend({
  tagName: 'tr',
  classNames: ['entry-row', 'data-row'],
  attributeBindings: ['entry.index:data-row-id'],

  fileManager: service(),
  errorExtractor: service(),
  parentAppNavigation: service(),
  appProxy: service(),

  /**
   * @virtual
   * @type {JsonInfiniteLogPage<RecallLogEntry>}
   */
  entry: undefined,

  /**
   * Should generate a full source file URL inside archive.
   * @virtual
   * @type {(fileId: string) => string}
   */
  onGenerateSourceFileUrl: notImplementedIgnore,

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

  fileCdmiObjectId: reads('entry.content.fileId'),

  fileId: computedPipe('fileCdmiObjectId', cdmiObjectIdToGuid),

  fileProxy: promise.object(computed('fileId', async function fileProxy() {
    const {
      fileManager,
      fileId,
    } = this.getProperties('fileManager', 'fileId');
    return fileManager.getFileById(fileId);
  })),

  fileNameProxy: promise.object(computed('fileProxy.name', async function fileProxy() {
    const {
      fileProxy,
    } = this.getProperties('fileProxy');
    return get(await fileProxy, 'name');
  })),

  fileName: computed('filePath', function fileName() {
    const filePath = this.get('filePath');
    if (!filePath || typeof filePath !== 'string') {
      return;
    }
    const pathArray = filePath.split('/');
    return pathArray[pathArray.length - 1];
  }),

  fileHref: computedPipe('fileId', 'onGenerateSourceFileUrl'),

  /**
   * @type {ComputedProperty<number>}
   */
  timestamp: computed('entry.timestamp', function () {
    const timestampMs = this.get('entry.timestamp');
    return Number.isInteger(timestampMs) ? timestampMs / 1000 : null;
  }),

  /**
   * @type {ComputedProperty<RecallInfoError>}
   */
  errorInfo: computed('entry.content.reason', function errorInfo() {
    const {
      entry,
      errorExtractor,
    } = this.getProperties('entry', 'errorExtractor');
    const reason = get(entry, 'content.reason');
    return parseRecallError(reason, errorExtractor);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  message: or('errorInfo.message', raw('–')),

  /**
   * @type {ComputedProperty<string>}
   */
  messageClass: or(
    and(
      equal('errorInfo.type', raw('raw')),
      raw('monospace-font')
    ),
    raw(''),
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  filePath: reads('entry.content.relativePath'),
});
