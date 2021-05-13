/**
 * Implementation of status part of table row part for filesystem-browser.
 *
 * @module components/filesystem-browser/table-row-status-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowStatusBar from 'oneprovider-gui/components/file-browser/fb-table-row-status-bar';
import { equal, not, raw, or, and, array } from 'ember-awesome-macros';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { EntityPermissions } from 'oneprovider-gui/utils/posix-permissions';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default FbTableRowStatusBar.extend(I18n, {
  classNames: ['filesystem-table-row-status-bar'],

  i18n: service(),
  currentUser: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableRowStatusBar',

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  invokeFileAction: notImplementedThrow,

  type: reads('file.type'),

  isSymlink: reads('fileRowModel.isSymlink'),

  hardlinksCount: or('file.hardlinksCount', raw(1)),

  isShared: reads('file.isShared'),

  typeText: computed('type', function typeText() {
    const type = this.get('type');
    if (type) {
      return this.t('fileType.' + type);
    }
  }),

  isForbidden: computed(
    'previewMode',
    'isSpaceOwned',
    'file.{type,owner.entityId,posixPermissions}',
    function isForbidden() {
      const {
        file,
        previewMode,
        isSpaceOwned,
      } = this.getProperties('file', 'previewMode', 'isSpaceOwned');
      if (isSpaceOwned) {
        return false;
      }
      const posixPermissions = get(file, 'posixPermissions');
      if (!posixPermissions) {
        return undefined;
      }
      let octalNumber;
      if (previewMode) {
        octalNumber = 2;
      } else {
        const fileOwnerGri = file.belongsTo('owner').id();
        const fileOwnerId = fileOwnerGri ? parseGri(fileOwnerGri).entityId : null;
        if (fileOwnerId === this.get('currentUser.userId')) {
          octalNumber = 0;
        } else {
          octalNumber = 1;
        }
      }
      const entityPermissions = EntityPermissions.create()
        .fromOctalRepresentation(get(file, 'posixPermissions')[octalNumber]);
      if (get(file, 'type') === 'file') {
        return !get(entityPermissions, 'read');
      } else {
        return !get(entityPermissions, 'read') || !get(entityPermissions, 'execute');
      }
    }
  ),

  /**
   * If true, should display dataset tag
   * @type {ComputedProperty<Boolean>}
   */
  showDatasetTag: and(
    not('previewMode'),
    not('isSymlink'),
    array.includes(raw(['ancestor', 'direct']), 'effDatasetMembership')
  ),

  showQosTag: and(
    not('previewMode'),
    not('isSymlink'),
    array.includes(raw(['ancestor', 'direct']), 'effQosMembership')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  datasetsViewForbidden: not('spacePrivileges.view'),

  effDatasetMembership: reads('file.effDatasetMembership'),

  hasMetadata: reads('file.hasMetadata'),

  effQosMembership: reads('file.effQosMembership'),

  hasAcl: equal('file.activePermissionsType', raw('acl')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtected: and(
    'showDatasetTag',
    'file.dataIsProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: and(
    'showDatasetTag',
    'file.metadataIsProtected'
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  hasAnyProtectionFlag: or('metadataIsProtected', 'dataIsProtected'),

  /**
   * Content for protection tag tooltip
   * @type {ComputedProperty<SafeString>}
   */
  protectionFlagsInfo: computed(
    'typeText',
    'metadataIsProtected',
    'dataIsProtected',
    function protectionFlagsInfo() {
      const {
        typeText,
        metadataIsProtected,
        dataIsProtected,
      } = this.getProperties('typeText', 'metadataIsProtected', 'dataIsProtected');
      let translationKey;
      if (dataIsProtected && metadataIsProtected) {
        translationKey = 'both';
      } else if (dataIsProtected) {
        translationKey = 'data';
      } else if (metadataIsProtected) {
        translationKey = 'metadata';
      }
      if (translationKey) {
        return this.t(`protectionFlagsInfo.${translationKey}`, { fileType: typeText });
      } else {
        return '';
      }
    }
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  qosViewForbidden: not('spacePrivileges.viewQos'),

  /**
   * Text for QoS tag tooltip, when cannot open QoS modal
   * @type {ComputedProperty<SafeString>}
   */
  hintQosViewForbidden: computed(function hintQosForbidden() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_view_qos',
    });
  }),

  /**
   * Text for dataset tag tooltip, when cannot open datasets modal
   * @type {ComputedProperty<SafeString>}
   */
  hintDatasetsViewForbidden: computed(function hintDatasetsViewForbidden() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_view',
    });
  }),
});
