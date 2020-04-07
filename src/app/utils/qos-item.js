/**
 * Model to use in `qos-modal/qos-entry` that epresents a QoS requirement in context
 * of some file.
 * 
 * @module utils/qos-item
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import { getBy, equal } from 'ember-awesome-macros';

export default EmberObject.extend({
  /**
   * EntityId of file for which the modal is opened
   * @type {String}
   */
  modalFileId: undefined,

  /**
   * @type {Models.Qos}
   */
  qos: undefined,

  /**
   * @type {Models.File}
   * File on which this QoS is set directly (to contrast modalFileId)
   */
  qosSourceFile: undefined,

  /**
   * @type {Models.FileQos}
   */
  fileQos: undefined,

  entityId: reads('qos.entityId'),
  fulfilled: reads('qos.fulfilled'),
  replicasNum: reads('qos.replicasNum'),
  expressionRpn: reads('qos.expressionRpn'),

  /**
   * True if this QoS is direct for file for which modal is opened
   * @type {ComputedProperty<Boolean>}
   */
  direct: equal('modalFileId', 'qosSourceFile.entityId'),

  /**
   * True if this QoS fulfills for file for which modal is opened
   * @type {ComputedProperty}
   */
  fulfilledForFile: getBy('fileQos.entries', 'qos.entityId'),
});