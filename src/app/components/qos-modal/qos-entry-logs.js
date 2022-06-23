/**
 * A container for QoS audit log browser in QoS entry.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: '',

  spaceManager: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosEntryLogs',

  /**
   * @virtual
   * @type {boolean}
   */
  isRendered: false,

  /**
   * @virtual
   * @type {string}
   */
  qosReqiurementId: undefined,

  /**
   * @virtual
   * @type {string}
   */
  fileType: undefined,

  /**
   * @virtual
   * @type {string}
   */
  spaceId: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<{ current: Model.Provider, all: Array<Model.Provider>}>>}
   */
  allSpaceProvidersProxy: promise.object(computed(
    'spaceId',
    async function spaceProvidersProxy() {
      const {
        spaceId,
        spaceManager,
      } = this.getProperties('spaceId', 'spaceManager');

      const space = await spaceManager.getSpace(spaceId);
      const providerList = (await get(await get(space, 'providerList'), 'list'))
        .toArray();

      return providerList;
    }
  )),

  /**
   * @type {ComputedProperty<number>}
   */
  spaceProvidersCount: reads('spaceProvidersProxy.content.all.length'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  headerTooltip: computed(
    'spaceProvidersCount',
    function headerTooltip() {
      const spaceProvidersCount = this.get('spaceProvidersCount');

      const translationKey = 'headerTooltip.' +
        (spaceProvidersCount > 1 ? 'manyProviders' : 'singleProvider');
      return this.t(translationKey);
    }
  ),
});
