/**
 * Show size stats of dir for oneprovider
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { formatNumber } from 'onedata-gui-common/helpers/format-number';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['size-stats-per-provider-row'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fileEntryCharts',

  /**
   * @virtual
   * @type {Object}
   */
  sizeStats: undefined,

  /**
   * @type {ComputedProperty<SafeString>}
   */
  logicalSize: computed('sizeStats.logicalSize', function logicalSize() {
    return formatNumber(this.sizeStats.logicalSize);
  }),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  physicalSize: computed('sizeStats.physicalSize', function physicalSize() {
    return formatNumber(this.sizeStats.physicalSize);
  }),

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

      return this.t('currentSize.elementsCount.template', {
        fileCount,
        dirCount,
        fileNoun: this.t(`currentSize.elementsCount.file.${filesNounVer}`),
        dirNoun: this.t(`currentSize.elementsCount.dir.${dirNounVer}`),
      });
    }
  ),
});
