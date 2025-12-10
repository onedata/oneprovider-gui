/**
 * Content for "publicdata" tab for single share
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set, observer } from '@ember/object';
import { reads, bool } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import moment from 'moment';
import { conditional, raw, eq } from 'ember-awesome-macros';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { MetadataType } from 'oneprovider-gui/models/handle';
import { allSettled } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import _ from 'lodash';

/**
 * @typedef {'show'|'edit'|'create'} MetadataEditorEditMode
 */

/**
 * Data for generating default XML metadata. It can be intepreted in various ways
 * by the specific metadata editor (eg. Dublin Core, EDM)
 * @typedef {Object} PublicDataInitialMetadata
 * @property {string} title
 * @property {string} creator
 * @property {string} description
 * @property {string} date
 * @property {string} shareUrl
 */

export default Component.extend(I18n, {
  classNames: ['share-show-pane-publicdata', 'pane-publicdata', 'row'],

  fileManager: service(),
  currentUser: service(),
  handleManager: service(),
  globalNotify: service(),
  appProxy: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.paneOpendata',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  publicMode: false,

  /**
   * Current XML content of Public Data metadata.
   * @type {String}
   */
  xml: undefined,

  /**
   * @type {Models.HandleService}
   */
  selectedHandleService: undefined,

  /**
   * @type {HandleModel.MetadataType}
   */
  selectedMetadataType: undefined,

  /**
   * @type {boolean}
   */
  isModifyingExistingMetadata: false,

  /**
   * @type {'visual'|'xml'}
   */
  dcViewMode: 'visual',

  /**
   * Imported for access in the template.
   * @type {Object<string, MetadataType>}
   */
  MetadataType,

  /**
   * @type {Array<HandleModel.MetadataType>}
   */
  metadataTypes: Object.freeze([
    MetadataType.DublinCore,
    MetadataType.Edm,
    MetadataType.DataCite,
    MetadataType.OpenAire,
  ]),

  metadataTypeOptions: computed('metadataTypes', function metadataTypeOptions() {
    const options = this.metadataTypes.map(metadataType => {
      return {
        id: metadataType,
        label: this.t(`publishWelcome.metadataTypes.${metadataType}`),
      };
    });
    return _.sortBy(options, 'label');
  }),

  selectedMetadataTypeOption: computed(
    'metadataTypeOptions',
    'selectedMetadataType',
    function selectedMetadataTypeOption() {
      return this.metadataTypeOptions.find(option =>
        option.id === this.selectedMetadataType
      );
    }
  ),

  isEdmMetadataType: eq('selectedMetadataType', raw(MetadataType.Edm)),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasManageSharesPrivilege: bool('space.privileges.manageShares'),

  isWelcomeProceedDisabled: bool('welcomeProceedDisabledTip'),

  welcomeProceedDisabledTip: computed(
    'selectedHandleService',
    'selectedMetadataType',
    'hasManageSharesPrivilege',
    function welcomeProceedDisabledTip() {
      if (!this.hasManageSharesPrivilege) {
        return insufficientPrivilegesMessage({
          i18n: this.i18n,
          modelName: 'space',
          privilegeFlag: 'space_manage_shares',
        });
      }
      if (!this.selectedHandleService || !this.selectedMetadataType) {
        return this.t('publishWelcome.selectHandleAndTypeFirst');
      }
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  activeSlideOfCreator: conditional(
    'exposePublicDataStarted',
    raw('createMetadata'),
    raw('welcome')
  ),

  /**
   * No dependent keys, because it should be computed once.
   * @type {ComputedProperty<PublicDataInitialMetadata}>}
   */
  initialData: computed(function initialData() {
    return {
      title: this.get('share.name'),
      creator: this.get('currentUser.userProxy.content.name'),
      description: '',
      date: moment().format('YYYY-MM-DD'),
      shareUrl: this.get('share.publicUrl'),
    };
  }),

  /**
   * @type {ComputedProperty<PromiseObject<Models.Handle>>}
   */
  handleProxy: promise.object(computed('share.handle', function handleProxy() {
    return this.get('share').getRelation('handle', { allowNull: true, reload: true })
      .then(handle => {
        if (handle) {
          return handle.getRelation('handleService', { allowNull: true })
            .catch(error => console.error(error))
            .then(() => handle);
        } else {
          return handle;
        }
      });
  })),

  /**
   * @type {ComputedProperty<PromiseObject<Models.File>>}
   */
  rootFileProxy: computedRelationProxy('share', 'rootFile'),

  /**
   * @type {ComputedProperty<Models.Handle>}
   */
  handle: reads('handleProxy.content'),

  /**
   * @type {ComputedProperty<PromiseObject<Array<Models.HandleService>>>}
   */
  handleServicesProxy: promise.object(computed('share.handle', function handleProxy() {
    return this.get('handleManager').getHandleServices();
  })),

  /**
   * @type {ComputedProperty<Models.HandleService>}
   */
  handleServices: reads('handleServicesProxy.content'),

  requiredDataProxy: computed(function requiredDataProxy() {
    return promiseObject(allSettled([this.handleProxy, this.rootFileProxy]));
  }),

  activeSlideObserver: observer('activeSlideOfCreator', function activeSlideObserver() {
    scrollTopClosest(this.get('element'));
  }),

  init() {
    this._super(...arguments);
    this.loadXml();
  },

  async loadXml() {
    const handle = await this.handleProxy;
    safeExec(this, () => {
      if (handle) {
        const metadataString = get(handle, 'metadataString');
        const metadataSchema = get(handle, 'metadataSchema');
        if (metadataString) {
          this.setProperties({
            xml: metadataString,
            selectedMetadataType: metadataSchema,
          });
        }
      }
    });
  },

  async modifyMetadata(metadataString) {
    if (!this.handle) {
      throw new Error(
        'PaneOpendata: no handle object to modify (maybe not loaded yet)'
      );
    }
    set(this.handle, 'metadataString', metadataString);
    try {
      await this.handle.save();
      await this.handle.reload();
    } catch (error) {
      this.globalNotify.backendError(this.t('modifyingMetadata'), error);
      throw error;
    }
    const newMetadataString = get(this.handle, 'metadataString');
    this.set('xml', newMetadataString);
  },

  actions: {
    async submit(xml) {
      if (!this.selectedMetadataType || !this.selectedHandleService) {
        throw new Error('no selectedMetadataType or selectedHandleService specified');
      }
      try {
        await this.handleManager.createHandle({
          share: this.share,
          metadataSchema: this.selectedMetadataType,
          metadataString: xml,
          handleServiceId: get(this.selectedHandleService, 'entityId'),
        });
      } catch (handleCreationError) {
        this.globalNotify.backendError(this.t('exposingMetadata'), handleCreationError);
        throw handleCreationError;
      } finally {
        try {
          this.appProxy.callParent('reloadShareList');
        } catch (error) {
          console.error(
            'share-show/pane-publicdata: failed to reload share list in Onezone GUI',
            error
          );
        }
      }
      safeExec(this, 'loadXml');
    },
    back() {
      this.setProperties({
        exposePublicDataStarted: false,
        xml: undefined,
        selectedHandleService: undefined,
        selectedMetadataType: undefined,
      });
    },
    updateXml(xml) {
      this.set('xml', xml);
    },
    async modifyMetadata(metadataXml) {
      await this.modifyMetadata(metadataXml);
    },
    changeEditMode(isEditing) {
      this.set('isModifyingExistingMetadata', isEditing);
    },
    changeDcViewMode(mode) {
      this.set('dcViewMode', mode);
    },
    selectMetadataTypeOption({ id }) {
      this.set('selectedMetadataType', id);
    },
  },
});
