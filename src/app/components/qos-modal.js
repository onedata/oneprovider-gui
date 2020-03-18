/**
 * Modal for viewing and editing QoS entries for file
 * 
 * @module components/qos-modal
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { reads } from '@ember/object/computed';
import { conditional, equal, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.qosModal',

  /**
   * @virtual
   * @type {boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @type {ComputedProperty<string>} one of: file, dir
   */
  fileType: reads('file.type'),

  /**
   * @type {ComputedProperty<string>}
   */
  typeTranslation: conditional(
    equal('fileType', raw('file')),
    computedT('fileType.file'),
    computedT('fileType.dir'),
  ),

  isFileQosFulfilled: false,

  fileQosStatus: conditional(
    'isFileQosFulfilled',
    raw('fulfilled'),
    raw('pending'),
  ),

  fileQosStatusText: conditional(
    'isFileQosFulfilled',
    computedT('status.fulfilled'),
    computedT('status.pending'),
  ),

  fileQosStatusClass: conditional(
    'isFileQosFulfilled',
    raw('success'),
    raw('default'),
  ),

  actions: {
    onShow() {

    },
    onHide() {
      this.get('onHide')();
    },
  },
});
