import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import {
  getFileNameFromPath,
} from 'onedata-gui-common/utils/file';
import { inject as service } from '@ember/service';
import createErrorMessageSpec from 'oneprovider-gui/utils/create-error-message-spec';
import { equal, raw, or, and } from 'ember-awesome-macros';

export default Component.extend({
  tagName: 'td',
  classNames: ['cell-file'],

  /**
   * @virtual
   * @type {Utils.ArchiveAuditLogEntryModel}
   */
  entryModel: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  absoluteFilePath: reads('entryModel.absoluteFilePath'),

  /**
   * @type {ComputedProperty<FileType>}
   */
  fileType: reads('entryModel.fileType'),

  /**
   * @type {ComputedProperty<string>}
   */
  fileName: computed('absoluteFilePath', function fileName() {
    return getFileNameFromPath(this.absoluteFilePath);
  }),

  errorExtractor: service(),

  /**
   * @virtual
   * @type {string}
   */

  /**
   * @virtual
   * @type {Object}
   */
  reason: undefined,

  /**
   * @type {ComputedProperty<ErrorMessageSpec>}
   */
  errorInfo: computed('reason', function errorInfo() {
    const {
      reason,
      errorExtractor,
    } = this.getProperties('reason', 'errorExtractor');
    return createErrorMessageSpec(reason, errorExtractor);
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
      raw('font-monospace')
    ),
    raw(''),
  ),
});
