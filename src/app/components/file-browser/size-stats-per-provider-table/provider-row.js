/**
 * Show size stats of dir for oneprovider
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['size-stats-per-provider-row'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.sizeStatsPerProviderTable.providerRow',

  /**
   * @virtual
   * @type {DirCurrentSizeStatsForProvider}
   */
  sizeStats: undefined,

  /**
   * @type {ComputedProperty<string>}
   */
  stringifiedLatestElementsCount: computed(
    'sizeStats.{regFileAndLinkCount,dirCount}',
    function stringifiedLatestElementsCount() {
      const fileCount = this.sizeStats.regFileAndLinkCount;
      const dirCount = this.sizeStats.dirCount;

      const filesNounVer = fileCount === 1 ? 'singular' : 'plural';
      const dirNounVer = dirCount === 1 ? 'singular' : 'plural';

      return this.t('elementsCount.template', {
        fileCount,
        dirCount,
        fileNoun: this.t(`elementsCount.file.${filesNounVer}`),
        dirNoun: this.t(`elementsCount.dir.${dirNounVer}`),
      });
    }
  ),
});
