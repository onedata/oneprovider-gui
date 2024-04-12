/**
 * An ACE editor. Includes tree editor and the whole collapsible-list
 * item content.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads, collect, not } from '@ember/object/computed';
import { or } from 'ember-awesome-macros';
import { numberToTree, treeToNumber } from 'oneprovider-gui/utils/acl-permissions-converter';
import aclPermissionsSpecification from 'oneprovider-gui/utils/acl-permissions-specification';
import I18n from 'onedata-gui-common/mixins/i18n';
import _ from 'lodash';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';

const permissionsSpecifications = ['file', 'dir'].reduce((spec, context) => {
  const filteredPermissions = [];
  aclPermissionsSpecification.forEach(group => {
    const filteredGroup = _.assign({}, group);
    filteredGroup.privileges = group.privileges.filter(permission =>
      permission.context.includes(context)
    );
    if (filteredGroup.privileges.length) {
      filteredPermissions.push(filteredGroup);
    }
  });
  spec[context] = filteredPermissions;
  return spec;
}, {});

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.aclEditor.aceEditor',

  /**
   * @virtual
   * @type {Components.OneCollapsibleListItem}
   */
  listItem: undefined,

  /**
   * @virtual
   * @type {Ace}
   */
  ace: undefined,

  /**
   * One of: `file`, `dir`
   * @virtual
   * @type {string}
   */
  context: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  readonly: false,

  /**
   * @virtual
   * @type {Function}
   * @param {Object} change { aceType: string, aceMask: number }
   * @returns {undefined}
   */
  onChange: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onMoveUp: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onMoveDown: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   * @returns {undefined}
   */
  onRemove: notImplementedIgnore,

  /**
   * @virtual
   * @type {boolean}
   */
  isFirstAce: false,

  /**
   * @virtual
   * @type {boolean}
   */
  isLastAce: false,

  /**
   * Permissions modified by editor. Object format the same as returned from
   * `numberToTree`.
   * @type {Object}
   */
  permissionsTree: undefined,

  /**
   * First permissions injected to component. Object format the same as
   * returned from `numberToTree`.
   * @type {Object}
   */
  initialPermissionsTree: undefined,

  /**
   * @type {Ember.ComputedProperty<Models.User|Models.Group|AceSubjectEquivalent>}
   */
  subject: reads('ace.subject'),

  /**
   * One of: `user`, `group`
   * @type {ComputedProperty<String>}
   */
  subjectType: reads('ace.subjectType'),

  /**
   * @type {ComputedProperty<String>}
   */
  identifier: reads('ace.identifier'),

  /**
   * One of `allow`, `deny`. Value is initialized in `init()` can be changed by
   * editor
   * @type {string}
   */
  aceType: undefined,

  /**
   * `aclPermissionsSpecification` object narrowed to the passed `context`
   * @type {Ember.ComputedProperty<Object>}
   */
  permissionsSpecification: computed(
    'context',
    function permissionsSpecification() {
      return permissionsSpecifications[this.get('context')];
    }
  ),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  icon: reads('subjectType'),

  /**
   * Mapping: permsGroupName -> { permName -> boolean }. Represents persisted
   * permissions before edition.
   * @type {Ember.ComputedProperty<Object>}
   */
  persistedPermissionsTree: computed(
    'ace.aceMask',
    'context',
    function persistedPermissionsTree() {
      const {
        ace,
        context,
      } = this.getProperties('ace', 'context');
      return numberToTree(get(ace, 'aceMask'), context);
    }
  ),

  /**
   * True if any of ACE permissions are true
   * @type {Ember.ComputedProperty<boolean>}
   */
  hasActivePermissions: computed(
    'permissionsTree',
    function hasActivePermissions() {
      const tree = this.get('permissionsTree');
      return _.flatten(
        _.values(tree).map(group => _.values(group))
      ).includes(true);
    }
  ),

  /**
   * Array of objects with fields:
   *   - icon: string,
   *   - stateClass: 'unset'|'checked'|'mixed',
   *   - tooltipText: string.
   * @type {Ember.ComputedProperty<Array<Object>>}
   */
  statusIcons: computed(
    'permissionsTree',
    'permissionsSpecification',
    'aceType',
    function statusIcons() {
      const {
        permissionsTree,
        permissionsSpecification,
        aceType,
        i18n,
      } = this.getProperties(
        'permissionsTree',
        'permissionsSpecification',
        'aceType',
        'i18n'
      );

      return permissionsSpecification.map(permissionsGroup => {
        const {
          groupName,
          privileges: permissions,
        } = permissionsGroup;

        let checkedPermissionsCount = 0;
        permissions.forEach(({ name }) => {
          if (permissionsTree[groupName][name]) {
            checkedPermissionsCount++;
          }
        });
        let stateClass;
        if (checkedPermissionsCount === 0) {
          stateClass = 'unset';
        } else if (checkedPermissionsCount === permissions.length) {
          stateClass = 'checked';
        } else {
          stateClass = 'mixed';
        }

        const groupNameTranslation =
          i18n.t(`components.aclEditor.permissionGroups.${groupName}`);
        const permissionsCounterString =
          `${checkedPermissionsCount}/${permissions.length}`;
        const permissonsStateTranslation =
          this.t(`acePermissionState.${aceType}`);
        return {
          icon: permissionsGroup.icon,
          stateClass,
          tooltipText: `${groupNameTranslation}: ${permissionsCounterString} ${permissonsStateTranslation}`,
        };
      });
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  moveUpAction: computed('isFirstAce', function moveUpAction() {
    return {
      action: () => this.get('onMoveUp')(),
      title: this.t('moveUp'),
      class: 'move-up-action',
      icon: 'move-up',
      disabled: this.get('isFirstAce'),
    };
  }),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  moveDownAction: computed('isLastAce', function moveDownAction() {
    return {
      action: () => this.get('onMoveDown')(),
      title: this.t('moveDown'),
      class: 'move-down-action',
      icon: 'move-down',
      disabled: this.get('isLastAce'),
    };
  }),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  removeAction: computed(function removeAction() {
    return {
      action: () => this.get('onRemove')(),
      title: this.t('remove'),
      class: 'remove-action',
      icon: 'browser-delete',
    };
  }),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  subjectName: or('subject.name', computedT('unknown')),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  tooltipText: computed(
    'subject.name',
    'identifier',
    function tooltipText() {
      const subjectName = this.get('subject.name');
      if (subjectName) {
        return subjectName;
      } else {
        return `${this.t('id')}: ${this.get('identifier')}`;
      }
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Array<Action>>}
   */
  actionsArray: collect('moveUpAction', 'moveDownAction', 'removeAction'),

  /**
   * True if there are no toggles enabled for the ACE - no operations are selected.
   * @type {ComputedProperty<boolean>}
   */
  hasNoRulesEnabled: not('hasActivePermissions'),

  /**
   * @type {ComputedProperty<string>}
   */
  headerTagIcon: computed('hasNoRulesEnabled', 'aceType', function headerTagIcon() {
    return this.hasNoRulesEnabled ?
      'sign-warning-rounded' : (this.aceType === 'allow' ? 'checked' : 'x');
  }),

  init() {
    this._super(...arguments);

    const persistedPermissionsTree = this.get('persistedPermissionsTree');
    this.setProperties({
      aceType: this.get('ace.aceType').toLowerCase(),
      permissionsTree: persistedPermissionsTree,
      initialPermissionsTree: persistedPermissionsTree,
    });
  },

  /**
   * @returns {undefined}
   */
  notifyAboutChange() {
    const {
      context,
      aceType,
      permissionsTree,
      onChange,
    } = this.getProperties(
      'context',
      'aceType',
      'permissionsTree',
      'onChange'
    );

    const permissions = treeToNumber(permissionsTree, context);
    onChange({
      aceType: aceType.toUpperCase(),
      aceMask: permissions,
    });
  },

  actions: {
    aceTypeChanged(type) {
      this.set('aceType', type);
      this.notifyAboutChange();
    },
    permissionsChanged(newPermissionsTree) {
      this.set('permissionsTree', newPermissionsTree);
      this.notifyAboutChange();
    },
  },
});
