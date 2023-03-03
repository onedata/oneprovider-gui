/**
 * Simple text info about number of files and size of archived data of archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { eq, conditional, typeOf, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  tagName: 'span',
  classNames: ['archive-content-count'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveContentCount',

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @type {ComputedProperty<Number|String>}
   */
  filesCount: conditional(
    eq(typeOf('archive.stats.filesArchived'), raw('number')),
    'archive.stats.filesArchived',
    computedT('unknownNumberOf')
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  sizeText: conditional(
    eq(typeOf('archive.stats.bytesArchived'), raw('number')),
    computedPipe('archive.stats.bytesArchived', bytesToString),
    computedT('unknownSize')
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  filesText: conditional(
    eq('filesCount', raw(1)),
    computedT('filesText.singular'),
    computedT('filesText.plural')
  ),
});
