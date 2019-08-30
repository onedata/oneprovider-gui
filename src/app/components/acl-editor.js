/**
 * An ACL editor component.
 * 
 * @module components/acl-editor
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { getProperties, setProperties, get, computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { array } from 'ember-awesome-macros';
import _ from 'lodash';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';

export default Component.extend(I18n, {
  classNames: ['acl-editor'],

  /**
   * @override
   */
  i18nPrefix: 'components.aclEditor',
  
  /**
   * Array of ACE (with additional `subject` field with fetched user/group model)
   * @virtual
   * @type {Array<Object>}
   */
  acl: undefined,

  /**
   * One of `file`, `directory`
   * @virtual
   * @type {string}
   */
  context: undefined,

  /**
   * @virtual
   * @type {Array<Models.User>}
   */
  users: Object.freeze([]),

  /**
   * @virtual
   * @type {Array<Models.User>}
   */
  groups: Object.freeze([]),

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Object>} change has the same format as `acl` field
   * @returns {undefined}
   */
  onChange: notImplementedIgnore,

  /**
   * @type {Ember.ComputedProperty<Array<Models.Group|Models.User>>}
   */
  sortedGroupAndUserList: array.sort(
    computed('groups.[]', 'users.[]', function concatenatedGroupsAndUsers() {
      const {
        groups,
        users,
      } = this.getProperties('groups', 'users');
      return groups.toArray().concat(users.toArray());
    }),
    ['name']
  ),

  /**
   * @returns {undefined}
   */
  notifyAboutChange() {
    const {
      acl,
      onChange,
    } = this.getProperties('acl', 'onChange');
    onChange(acl);
  },

  actions: {
    aceChanged(ace, change) {
      setProperties(ace, getProperties(change, 'aceMask', 'aceType'));
      this.notifyAboutChange();
    },
    moveUp(ace) {
      const acl = this.get('acl');
      const aceIndex = acl.indexOf(ace);
      if (aceIndex > 0) {
        const prevAce = acl.objectAt(aceIndex - 1);
        acl
          .replace(aceIndex - 1, 1, [ace])
          .replace(aceIndex, 1, [prevAce]);
        this.notifyAboutChange();
      }
    },
    moveDown(ace) {
      const acl = this.get('acl');
      const aceIndex = acl.indexOf(ace);
      if (aceIndex < get(acl, 'length') - 1) {
        const nextAce = acl.objectAt(aceIndex + 1);
        acl
          .replace(aceIndex + 1, 1, [ace])
          .replace(aceIndex, 1, [nextAce]);
        this.notifyAboutChange();
      }
    },
    remove(ace) {
      this.get('acl').removeObject(ace);
      this.notifyAboutChange();
    },
    addEntitySelected(entity) {
      const newAce = {
        aceMask: 0,
        aceType: 'ALLOW',
        identifier: get(entity, 'entityId'),
        aceFlags: entity.constructor.modelName === 'group' ?
          AceFlagsMasks.IDENTIFIER_GROUP : AceFlagsMasks.NO_FLAGS,
        subject: entity,
      };
      this.get('acl').pushObject(newAce);
      this.notifyAboutChange();
    },
    nameMatcher(model, term) {
      term = term.toLocaleLowerCase();
      const name = get(model, 'name').toLocaleLowerCase();
      return _.includes(name, term) ? 1 : -1;
    },
  },
});
