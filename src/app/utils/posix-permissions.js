/**
 * Posix permissions class, that allows to convert permissions between various
 * representations.
 * 
 * @module utils/posix-permissions
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { array, collect, raw, multiply, sum } from 'ember-awesome-macros';

export default EmberObject.extend({
  /**
   * @type {Ember.ComputedProperty<EntityPermissions>}
   */
  user: computed(() => EntityPermissions.create()),

  /**
   * @type {Ember.ComputedProperty<EntityPermissions>}
   */
  group: computed(() => EntityPermissions.create()),

  /**
   * @type {Ember.ComputedProperty<EntityPermissions>}
   */
  other: computed(() => EntityPermissions.create()),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  stringRepresentation: array.join(
    collect(
      'user.stringRepresentation',
      'group.stringRepresentation',
      'other.stringRepresentation'
    ),
    raw(' ')
  ),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  octalRepresentation: sum(
    multiply('user.octalRepresentation', raw(100)),
    multiply('group.octalRepresentation', raw(10)),
    'other.octalRepresentation'
  ),

  /**
   * Sets permissions using given octal representation
   * @param {number} octal permissions representation
   *   (octal number in range 0-777)
   * @return {undefined}
   */
  fromOctalRepresentation(octal) {
    const {
      user,
      group,
      other,
    } = this.getProperties('user', 'group', 'other');

    user.fromOctalRepresentation(Math.floor(octal / 100));
    group.fromOctalRepresentation(Math.floor(octal / 10) % 10);
    other.fromOctalRepresentation(Math.floor(octal % 10));
  },
});

/**
 * Represents permissions for one entity (user, group or other). Is used
 * internally by PosixPermissions class.
 */
const EntityPermissions = EmberObject.extend({
  /**
   * @virtual
   * @type {boolean}
   */
  read: false,
  
  /**
   * @virtual
   * @type {boolean}
   */
  write: false,

  /**
   * @virtual
   * @type {boolean}
   */
  execute: false,

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  stringRepresentation: computed(
    'read',
    'write',
    'execute',
    function stringRepresentation() {
      const {
        read,
        write,
        execute,
      } = this.getProperties('read', 'write', 'execute');
      return (read ? 'r' : '-') + (write ? 'w' : '-') + (execute ? 'x' : '-');
    }
  ),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  octalRepresentation: computed(
    'read',
    'write',
    'execute',
    function octalRepresentation() {
      const {
        read,
        write,
        execute,
      } = this.getProperties('read', 'write', 'execute');
      return (read ? 4 : 0) + (write ? 2 : 0) + (execute ? 1 : 0);
    }
  ),

  /**
   * Sets permissions using given octal representation
   * @param {number} octal permissions representation (number in range 0-7)
   * @return {undefined}
   */
  fromOctalRepresentation(octal) {
    this.setProperties({
      read: Boolean(octal & 4),
      write: Boolean(octal & 2),
      execute: Boolean(octal & 1),
    });
  },
});
