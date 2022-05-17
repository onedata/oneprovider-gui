/**
 * Container for tags representing features that can be direct or inherited for file.
 *
 * @module components/filesystem-browser/file-features
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { or, not } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { computed, observer, get } from '@ember/object';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import recallingPercentageProgress from 'oneprovider-gui/utils/recalling-percentage-progress';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import computedArchiveRecallStateProxy from 'oneprovider-gui/utils/computed-archive-recall-state-proxy';

export const defaultFilesystemFeatures = Object.freeze([
  'effDatasetMembership',
  'effQosMembership',
  'recallingMembership',
]);

export default Component.extend(I18n, {
  classNames: ['file-features'],

  i18n: service(),
  archiveRecallStateManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.fileFeatures',

  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  item: undefined,

  /**
   * @virtual
   * @type {(item: BrowsableItem, actionName: String) => undefined}
   */
  onInvokeItemAction: notImplementedThrow,

  /**
   * @virtual
   * @type {(tag: String, isHovered: Boolean) => undefined}
   */
  onTagHoverChange: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * Same as in: `components/file-browser/item-features-container`
   * @virtual
   * @type {ComputedProperty<Array<String>>}
   */
  features: reads('browserModel.fileFeatures'),

  file: reads('item'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: reads('browserModel.spacePrivileges'),

  inheritedIcon: 'inheritance',

  /**
   * See: `service:archive-recall-state-manager`
   * @type {String}
   */
  archiveRecallWatcherToken: null,

  dataIsProtected: reads('item.dataIsProtected'),

  metadataIsProtected: reads('item.metadataIsProtected'),

  hasAnyProtectionFlag: or('dataIsProtected', 'metadataIsProtected'),

  effDatasetDisabled: or('disabled', 'datasetsViewForbidden'),

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
  datasetsViewForbidden: not('spacePrivileges.view'),

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

  effQosDisabled: or('disabled', 'qosViewForbidden'),

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

  effRecallingDisabled: reads('disabled'),

  itemType: reads('item.type'),

  typeText: computed('itemType', function typeText() {
    const itemType = this.get('itemType');
    if (itemType) {
      return this.t('fileType.' + itemType);
    }
  }),

  archiveRecallInfoProxy: computedRelationProxy(
    'file',
    'archiveRecallInfo'
  ),

  archiveRecallStateProxy: computedArchiveRecallStateProxy(
    'archiveRecallInfoProxy',
    'internalArchiveRecallStateProxy',
  ),

  /**
   * @private
   * @type {ComputedProperty<PromiseObject<Models.ArchiveRecallState>>}
   */
  internalArchiveRecallStateProxy: computedRelationProxy(
    'file',
    'archiveRecallState'
  ),

  recallingPercent: computed(
    'file.{recallingMembership,archiveRecallState.bytesCopied,archiveRecallInfo.totalByteSize}',
    function recallingPercent() {
      return recallingPercentageProgress(this.get('file'));
    }
  ),

  recallingProgressStyle: computed(
    'recallingPercent',
    function recallingProgressStyle() {
      const recallingPercent = this.get('recallingPercent');
      const widthPercent = recallingPercent === null ? 100 : recallingPercent;
      return htmlSafe(`width: ${widthPercent}%;`);
    }
  ),

  recallingLabelKey: computed('recallingPercent', function recallingLabelKey() {
    const recallingPercent = this.get('recallingPercent');
    if (typeof recallingPercent === 'number') {
      return 'status.recalling';
    } else {
      return 'status.recallingUnknownPercent';
    }
  }),

  recallingMembershipObserver: observer(
    'item.recallingMembership',
    function recallingMembershipObserver() {
      this.tryDestroyRecallWatcher();
      this.tryCreateRecallWatcher();
    }
  ),

  init() {
    this._super(...arguments);
    this.tryCreateRecallWatcher();
  },

  tryCreateRecallWatcher() {
    const {
      item,
      archiveRecallStateManager,
      archiveRecallWatcherToken,
    } = this.getProperties(
      'item',
      'archiveRecallStateManager',
      'archiveRecallWatcherToken',
    );
    if (archiveRecallWatcherToken) {
      // watcher already registered for this component
      return;
    }
    const recallingMembership = item && get(item, 'recallingMembership');
    if (recallingMembership === 'direct' || recallingMembership === 'ancestor') {
      const archiveRecallWatcherToken =
        archiveRecallStateManager.watchRecall(item);
      this.set('archiveRecallWatcherToken', archiveRecallWatcherToken);
    }
  },

  tryDestroyRecallWatcher() {
    const {
      archiveRecallStateManager,
      archiveRecallWatcherToken,
      item,
    } = this.getProperties(
      'archiveRecallStateManager',
      'archiveRecallWatcherToken',
      'item',
    );
    if (archiveRecallWatcherToken) {
      archiveRecallStateManager.unwatchRecall(
        item,
        archiveRecallWatcherToken
      );
    }
  },

  invokeItemAction(actionName) {
    const {
      onInvokeItemAction,
      item,
    } = this.getProperties('onInvokeItemAction', 'item');
    return onInvokeItemAction(item, actionName);
  },

  willDestroyElement() {
    this._super(...arguments);
    this.tryDestroyRecallWatcher();
  },

  actions: {
    datasetTagClicked() {
      if (!this.get('effDatasetDisabled')) {
        this.invokeItemAction('datasets');
      }
    },
    qosTagClicked() {
      if (!this.get('effQosDisabled')) {
        this.invokeItemAction('qos');
      }
    },
    recallTagClicked() {
      if (!this.get('effRecallingDisabled')) {
        this.invokeItemAction('recallInfo');
      }
    },
    changeTagHover(tag, hovered) {
      this.get('onTagHoverChange')(tag, hovered);
    },
  },
});
