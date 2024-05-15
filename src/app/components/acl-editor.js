/**
 * An ACL editor component.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { getProperties, setProperties, get, computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/i18n';
import { array } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { AceFlagsMasks } from 'oneprovider-gui/utils/acl-permissions-specification';
import { guidFor } from '@ember/object/internals';
import sleep from 'onedata-gui-common/utils/sleep';

/**
 * @typedef {object} AclEditorListItem
 * @property {string} id GUID of ACE object.
 * @property {Ace} ace
 */

export default Component.extend(I18n, {
  classNames: ['acl-editor'],
  classNameBindings: ['readonly'],

  i18n: service(),

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
   * One of `file`, `dir`
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
   * @type {Array<Object>}
   */
  systemSubjects: undefined,

  /**
   * Set to true if list of group or users might be incomplete due to lack of permissions.
   * @virtual optional
   * @type {boolean}
   */
  hasInferredSubjectList: false,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Object>} change has the same format as `acl` field
   * @returns {undefined}
   */
  onChange: notImplementedIgnore,

  groupsAndUsers: computed('groups.[]', 'users.[]', function groupsAndUsers() {
    const {
      groups,
      users,
    } = this.getProperties('groups', 'users');
    return groups.toArray().concat(users.toArray());
  }),

  /**
   * @type {Ember.ComputedProperty<Array<Models.Group|Models.User>>}
   */
  sortedGroupsAndUsers: array.sort('groupsAndUsers', ['name']),

  /**
   * @type {Ember.ComputedProperty<Array<Models.Group|Models.User|Object>>}
   */
  subjectsList: array.concat('sortedGroupsAndUsers', 'systemSubjects'),

  /**
   * @type {ComputedProperty<Array<AclEditorListItem>>}
   */
  aceListItems: computed('acl.[]', function aceListItems() {
    const x = this.acl?.map(ace => ({
      id: guidFor(ace),
      ace,
    })) ?? [];
    return x;
  }),

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

  addEntity(entity) {
    const modelName = get(entity, 'constructor.modelName');
    const subjectType = modelName || get(entity, 'equivalentType') || 'group';
    const aceFlags = get(entity, 'constructor.modelName') === 'group' ?
      AceFlagsMasks.IDENTIFIER_GROUP : AceFlagsMasks.NO_FLAGS;

    const newAce = {
      aceMask: 0,
      aceType: 'ALLOW',
      identifier: get(entity, 'entityId'),
      aceFlags,
      subject: entity,
      subjectType,
    };
    this.get('acl').pushObject(newAce);
    (async () => {
      await sleep(0);
      this.expandAce(guidFor(newAce));
    })();
    this.notifyAboutChange();
  },

  expandAce(aceId) {
    const aceItemElement = this.element?.querySelector(`#ace-item-${aceId}`);
    if (!aceItemElement) {
      console.warn('AclEditor: New ACE item not found on list');
    }

    aceItemElement
      ?.querySelector('.one-collapsible-list-item-header')
      ?.click();

    const onTransitionEnd = () => {
      aceItemElement.scrollIntoView();
      aceItemElement.removeEventListener('transitionend', onTransitionEnd);
    };

    aceItemElement.addEventListener('transitionend', onTransitionEnd);
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
      this.addEntity(entity);
    },
  },
});
