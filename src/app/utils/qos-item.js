/**
 * Model to use in `qos-modal/qos-entry` that represents a QoS requirement in context
 * of some file.
 * 
 * @module utils/qos-item
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { not } from '@ember/object/computed';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Models.QosRequirement}
   */
  qos: undefined,

  /**
   * File on which this QoS is set directly(to contrast modalFileId)
   * @virtual
   * @type {Models.File}
   */
  qosSourceFile: undefined,

  /**
   * @virtual
   * @type {String}
   */
  entityId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  replicasNum: undefined,

  /**
   * @virtual
   * @type {String}
   */
  expressionRpn: undefined,

  /**
   * True if this QoS is direct for file for which modal is opened
   * @virtual
   * @type {Boolean}
   */
  direct: undefined,

  /**
   * Status of QoS for file for which modal is opened
   * @virtual
   * @type {String}
   */
  statusForFile: undefined,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  inherited: not('direct'),
});
