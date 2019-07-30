/**
 * An ACL editor component. Automatically fetches users and groups lists from
 * passed space.
 * 
 * @module components/acl-editor
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * @typedef {Object} Ace
 * @property {number} permissions
 * @property {string} type 'allow' | 'deny'
 * @property {Models.User|Models.Group} subject
 */

import Component from '@ember/component';
import { getProperties, setProperties, get } from '@ember/object';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { array } from 'ember-awesome-macros';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { Promise } from 'rsvp';
import _ from 'lodash';

export default Component.extend(
  I18n,
  createDataProxyMixin('aclSnapshot', { type: 'array' }), {
    classNames: ['acl-editor'],

    /**
     * @override
     */
    i18nPrefix: 'components.aclEditor',
    
    /**
     * Array of { permissions: number, type: string, subjectId: string }
     * @virtual
     * @type {Array<Object>}
     */
    acl: undefined,

    /**
     * Needed to fetch users and groups for possible new ACE
     * @virtual
     * @type {Models.Space}
     */
    space: undefined,

    /**
     * @type {Function}
     * @param {Array<Object>} change has the same format as `acl` field
     *   (without `subjectId`)
     * @returns {undefined}
     */
    onChange: notImplementedIgnore,

    /**
     * @type {Array<Models.Group>}
     */
    groupList: Object.freeze([]),

    /**
     * @type {Array<Models.User>}
     */
    userList: Object.freeze([]),

    /**
     * @type {Ember.ComputedProperty<Array<Models.Group|Models.User>>}
     */
    sortedGroupAndUserList: array.sort(
      array.concat('groupList', 'userList'),
      ['name']
    ),

    /**
     * @override
     */
    fetchAclSnapshot() {
      return this.fetchUsersAndGroups().then(() => {
        const {
          userList,
          groupList,
          acl,
        } = this.getProperties('userList', 'groupList', 'acl');

        return Promise.all(acl.map(ace => {
          const {
            permissions,
            type,
            subject: subjectId,
          } = getProperties(ace, 'permissions', 'type', 'subject');
  
          let subject;
          const parsedSubjectGri = parseGri(subjectId);
          if (parsedSubjectGri.entityType === 'op_user') {
            subject = userList.findBy('entityId', parsedSubjectGri.entityId);
          } else {
            subject = groupList.findBy('entityId', parsedSubjectGri.entityId);
          }

          return {
            permissions,
            type,
            subject,
          };
        }));
      });
    },

    /**
     * @returns {Promise<Array>}
     */
    fetchUsersAndGroups() {
      const space = this.get('space');
      return Promise.all([
        get(space, 'effUserList').then(userList => get(userList, 'list')),
        get(space, 'effGroupList').then(groupList => get(groupList, 'list')),
      ]).then(lists => safeExec(this, () => {
        this.setProperties({
          userList: lists[0],
          groupList: lists[1],
        });
      }));
    },

    /**
     * @returns {undefined}
     */
    notifyAboutChange() {
      const {
        aclSnapshot,
        onChange,
      } = this.getProperties('aclSnapshot', 'onChange');
      onChange(aclSnapshot);
    },

    actions: {
      aceChanged(ace, change) {
        setProperties(ace, getProperties(change, 'permissions', 'type'));
        this.notifyAboutChange();
      },
      moveUp(ace) {
        const aclSnapshot = this.get('aclSnapshot');
        const aceIndex = aclSnapshot.indexOf(ace);
        if (aceIndex > 0) {
          const prevAce = aclSnapshot.objectAt(aceIndex - 1);
          aclSnapshot
            .replace(aceIndex - 1, 1, [ace])
            .replace(aceIndex, 1, [prevAce]);
          this.notifyAboutChange();
        }
      },
      moveDown(ace) {
        const aclSnapshot = this.get('aclSnapshot');
        const aceIndex = aclSnapshot.indexOf(ace);
        if (aceIndex < get(aclSnapshot, 'length') - 1) {
          const nextAce = aclSnapshot.objectAt(aceIndex + 1);
          aclSnapshot
            .replace(aceIndex + 1, 1, [ace])
            .replace(aceIndex, 1, [nextAce]);
          this.notifyAboutChange();
        }
      },
      remove(ace) {
        this.get('aclSnapshot').removeObject(ace);
        this.notifyAboutChange();
      },
      addEntitySelected(entity) {
        const newAce = {
          permissions: 0,
          type: 'allow',
          subject: entity,
        };
        this.get('aclSnapshot').pushObject(newAce);
        this.notifyAboutChange();
      },
      nameMatcher(model, term) {
        term = term.toLocaleLowerCase();
        const name = get(model, 'name').toLocaleLowerCase();
        return _.includes(name, term) ? 1 : -1;
      },
    },
  }
);
