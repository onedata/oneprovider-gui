/**
 * Content for "opendata" tab for single share
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import moment from 'moment';
import { conditional, raw } from 'ember-awesome-macros';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, {
  classNames: ['share-show-pane-opendata', 'pane-opendata', 'row'],

  fileManager: service(),
  currentUser: service(),
  handleManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.paneOpendata',

  /**
   * @virtual
   */
  share: undefined,

  /**
   * Current XML content od Dublin Core Metadata.
   * @type {String}
   */
  xml: undefined,

  /**
   * @type {Models.HandleService}
   */
  selectedHandleService: undefined,

  /**
   * @type {ComputedProperty<String>}
   */
  activeSlideOfCreator: conditional(
    'publishOpenDataStarted',
    raw('createMetadata'),
    raw('welcome')
  ),

  /**
   * Default data for Dublin Core form.
   * No dependent keys, because it is computed once.
   * @type {ComputedProperty<Object>}
   */
  initialData: computed(function initialData() {
    return {
      title: this.get('share.name'),
      creator: this.get('currentUser.userProxy.content.name'),
      description: '',
      date: moment().format('YYYY-MM-DD'),
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

  activeSlideObserver: observer('activeSlideOfCreator', function activeSlideObserver() {
    scrollTopClosest(this.get('element'));
  }),

  init() {
    this._super(...arguments);
    this.loadXml();
  },

  loadXml() {
    return this.get('handleProxy').then(handle => {
      safeExec(this, () => {
        if (handle) {
          const metadataString = get(handle, 'metadataString');
          if (metadataString) {
            this.set('xml', metadataString);
          } else {
            this.set('noMetadata', true);
          }
        }
      });
    });
  },

  actions: {
    submit(xml, handleServiceId) {
      const {
        share,
        handleManager,
      } = this.getProperties('share', 'handleManager');
      return handleManager.createHandle(share, handleServiceId, xml)
        .then(() => {
          safeExec(this, 'loadXml');
        });
    },
    xmlChanged(xml) {
      this.set('xml', xml);
    },
    toggleEditorMode() {
      const editorMode = this.get('editorMode');
      const newMode = (editorMode === 'visual') ? 'xml' : 'visual';
      this.set('editorMode', newMode);
    },
    back() {
      this.set('publishOpenDataStarted', false);
    },
    updateXml(xml) {
      this.set('xml', xml);
    },
  },
});
