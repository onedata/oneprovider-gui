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
import { array, collect, raw } from 'ember-awesome-macros';

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
   * @type {Ember.ComputedProperty<string>}
   */
  octalRepresentation: array.join(
    collect(
      'user.octalRepresentation',
      'group.octalRepresentation',
      'other.octalRepresentation'
    ),
    raw('')
  ),

  /**
   * Sets permissions using given octal representation
   * @param {string} octal permissions representation
   *   (octal number in range 000-777)
   * @return {undefined}
   */
  fromOctalRepresentation(octal) {
    const {
      user,
      group,
      other,
    } = this.getProperties('user', 'group', 'other');

    user.fromOctalRepresentation(octal[0]);
    group.fromOctalRepresentation(octal[1]);
    other.fromOctalRepresentation(octal[2]);
    return this;
  },
});

/**
 * Represents permissions for one entity (user, group or other). Is used
 * internally by PosixPermissions class.
 */
export const EntityPermissions = EmberObject.extend({
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
   * @type {Ember.ComputedProperty<string>}
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
      return String((read ? 4 : 0) + (write ? 2 : 0) + (execute ? 1 : 0));
    }
  ),

  /**
   * Sets permissions using given octal representation
   * @param {string} octal permissions representation (stringified number
   *   in range 0-7)
   * @return {undefined}
   */
  fromOctalRepresentation(octal) {
    const octalNumber = Number.parseInt(octal);
    this.setProperties({
      read: Boolean(octalNumber & 4),
      write: Boolean(octalNumber & 2),
      execute: Boolean(octalNumber & 1),
    });
    return this;
  },
});
