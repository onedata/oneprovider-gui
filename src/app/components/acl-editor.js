import Component from '@ember/component';
import { getProperties, setProperties, get } from '@ember/object';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { Promise } from 'rsvp';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
// import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';

export default Component.extend(
  createDataProxyMixin('aclRulesSnapshot', { type: 'array' }), {
    classNames: ['acl-editor'],

    // userManager: service(),
    // groupManager: service(),
    
    /**
     * @virtual
     */
    aclRules: undefined,

    /**
     * @type {Function}
     * @param {Array<Object>} change has the same format as `aclRules` field
     * @returns {undefined}
     */
    onChange: notImplementedIgnore,

    fetchAclRulesSnapshot() {
      const {
        aclRules,
        userManager,
        groupManager,
      } = this.getProperties(
        'aclRules',
        'userManager',
        'groupManager'
      );

      return Promise.all(aclRules.map(acl => {
        const {
          permissions,
          type,
          subject: subjectId,
        } = getProperties(acl, 'permissions', 'type', 'subject');

        let fetchSubjectPromise;
        // if (parseGri(subjectId).entityType === 'op_user') {
        //   fetchSubjectPromise = userManager.findRecord(subjectId);
        // } else {
        //   fetchSubjectPromise = groupManager.findRecord(subjectId);
        // }
        fetchSubjectPromise = Promise.resolve({
          name: 'Borzo Zborzowy',
        });
        return fetchSubjectPromise.then(subject => ({
          permissions,
          type,
          subject,
        }));
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
    },
  }
);
