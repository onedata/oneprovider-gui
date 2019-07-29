import Component from '@ember/component';
import { getProperties, setProperties, get } from '@ember/object';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { array } from 'ember-awesome-macros';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { Promise } from 'rsvp';

export default Component.extend(
  I18n,
  createDataProxyMixin('aclRulesSnapshot', { type: 'array' }), {
    classNames: ['acl-editor'],

    /**
     * @override
     */
    i18nPrefix: 'components.aclEditor',
    
    /**
     * @virtual
     */
    aclRules: undefined,

    /**
     * @type {Models.Space}
     */
    space: undefined,

    /**
     * @type {Array<Models.Group>}
     */
    groupList: Object.freeze([]),

    /**
     * @type {Array<Models.User>}
     */
    userList: Object.freeze([]),

    /**
     * @type {Array<Models.Group|Models.User>}
     */
    sortedGroupAndUserList: array.sort(
      array.concat('groupList', 'userList'),
      ['name']
    ),

    /**
     * @type {Function}
     * @param {Array<Object>} change has the same format as `aclRules` field
     * @returns {undefined}
     */
    onChange: notImplementedIgnore,

    fetchAclRulesSnapshot() {
      return this.fetchUsersAndGroups().then(() => {
        const {
          userList,
          groupList,
          aclRules,
        } = this.getProperties('userList', 'groupList', 'aclRules');

        return Promise.all(aclRules.map(acl => {
          const {
            permissions,
            type,
            subject: subjectId,
          } = getProperties(acl, 'permissions', 'type', 'subject');
  
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

    notifyAboutChange() {
      const {
        aclRulesSnapshot,
        onChange,
      } = this.getProperties('aclRulesSnapshot', 'onChange');
      onChange(aclRulesSnapshot);
    },

    actions: {
      aclChanged(entry, change) {
        setProperties(entry, getProperties(change, 'permissions', 'type'));
        this.notifyAboutChange();
      },
      moveUp(entry) {
        const aclRulesSnapshot = this.get('aclRulesSnapshot');
        const entryIndex = aclRulesSnapshot.indexOf(entry);
        if (entryIndex > 0) {
          const prevEntry = aclRulesSnapshot.objectAt(entryIndex - 1);
          aclRulesSnapshot
            .replace(entryIndex - 1, 1, [entry])
            .replace(entryIndex, 1, [prevEntry]);
          this.notifyAboutChange();
        }
      },
      moveDown(entry) {
        const aclRulesSnapshot = this.get('aclRulesSnapshot');
        const entryIndex = aclRulesSnapshot.indexOf(entry);
        if (entryIndex < get(aclRulesSnapshot, 'length') - 1) {
          const nextEntry = aclRulesSnapshot.objectAt(entryIndex + 1);
          aclRulesSnapshot
            .replace(entryIndex + 1, 1, [entry])
            .replace(entryIndex, 1, [nextEntry]);
          this.notifyAboutChange();
        }
      },
      remove(entry) {
        this.get('aclRulesSnapshot').removeObject(entry);
        this.notifyAboutChange();
      },
      addEntitySelected(entity) {
        const newRule = {
          permissions: 0,
          type: 'allow',
          subject: entity,
        };
        this.get('aclRulesSnapshot').pushObject(newRule);
        this.notifyAboutChange();
      },
    },
  }
);
