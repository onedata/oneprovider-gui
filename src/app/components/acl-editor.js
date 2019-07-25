import Component from '@ember/component';
import { getProperties, setProperties, get } from '@ember/object';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { inject as service } from '@ember/service';
import { Promise } from 'rsvp';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
// import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';

export default Component.extend(
  createDataProxyMixin('aclCollectionSnapshot', { type: 'array' }), {
    classNames: ['acl-editor'],

    // userManager: service(),
    // groupManager: service(),
    
    aclCollection: Object.freeze([{
      type: 'allow',
      permissions: 393219,
      subject: 'jakiesId',
    }, {
      type: 'deny',
      permissions: 1,
      subject: 'jakiesId1',
    }]),

    /**
     * @type {Function}
     * @param {Array<Object>} change has the same format as `aclCollection`
     *   field
     * @returns {undefined}
     */
    onChange: notImplementedIgnore,

    fetchAclCollectionSnapshot() {
      const {
        aclCollection,
        userManager,
        groupManager,
      } = this.getProperties(
        'aclCollection',
        'userManager',
        'groupManager'
      );

      return Promise.all(aclCollection.map(acl => {
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
        aclCollectionSnapshot,
        onChange,
      } = this.getProperties('aclCollectionSnapshot', 'onChange');
      onChange(aclCollectionSnapshot);
      console.log(aclCollectionSnapshot);
    },

    actions: {
      aclChanged(entry, change) {
        setProperties(entry, getProperties(change, 'permissions', 'type'));
        this.notifyAboutChange();
      },
      moveUp(entry) {
        const aclCollectionSnapshot = this.get('aclCollectionSnapshot');
        const entryIndex = aclCollectionSnapshot.indexOf(entry);
        if (entryIndex > 0) {
          const prevEntry = aclCollectionSnapshot.objectAt(entryIndex - 1);
          aclCollectionSnapshot
            .replace(entryIndex - 1, 1, [entry])
            .replace(entryIndex, 1, [prevEntry]);
          this.notifyAboutChange();
        }
      },
      moveDown(entry) {
        const aclCollectionSnapshot = this.get('aclCollectionSnapshot');
        const entryIndex = aclCollectionSnapshot.indexOf(entry);
        if (entryIndex < get(aclCollectionSnapshot, 'length') - 1) {
          const nextEntry = aclCollectionSnapshot.objectAt(entryIndex + 1);
          aclCollectionSnapshot
            .replace(entryIndex + 1, 1, [entry])
            .replace(entryIndex, 1, [nextEntry]);
          this.notifyAboutChange();
        }
      },
      remove(entry) {
        this.get('aclCollectionSnapshot').removeObject(entry);
        this.notifyAboutChange();
      },
    },
  }
);
