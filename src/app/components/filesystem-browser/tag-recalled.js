/**
 * Conditionally display "Recalled" file tag for files that recall from archive
 * have been finished (successfully or not).
 *
 * NOTE: custom file requiremets must be managed by parent component - see `file` property
 * note.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { raw, and, or, bool } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tagRecalled',

  /**
   * NOTE: custom file requiremets must be managed by parent component.
   * Typically it is done by FilesystemBrowserModel, as this component is used in the
   * filesystem browser context.
   *
   * Used custom properties:
   * - `isRecalled`
   *
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * @virtual optional
   * @type () => void
   */
  onTagClicked: notImplementedIgnore,

  archiveRecallInfo: reads('file.archiveRecallInfo.content'),

  errorOccurred: reads('archiveRecallInfo.errorOccurred'),

  cancelled: bool('archiveRecallInfo.cancelTime'),

  statusTagClass: or(
    and('disabled', raw('file-status-tag-disabled')),
    and('errorOccurred', raw('file-status-tag-danger')),
    and('cancelled', raw('file-status-tag-warning')),
    raw('file-status-tag-default'),
  ),

  labelKey: or(
    and('errorOccurred', raw('recallFailed')),
    and('cancelled', raw('recallCancelled')),
    raw('recalled'),
  ),

  actions: {
    tagClicked() {
      const onTagClicked = this.get('onTagClicked');
      if (onTagClicked) {
        onTagClicked();
      }
    },
  },
});
