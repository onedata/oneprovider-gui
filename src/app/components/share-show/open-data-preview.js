/**
 * Open Data viewer with visual (Dublin Core Metadata values render) and XML (raw text)
 * modes.
 *
 * @module components/share-show/open-data-preview
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import { get, computed } from '@ember/object';
import dublinCoreXmlParser from 'oneprovider-gui/utils/dublin-core-xml-parser';
import OpenData from './-open-data';

export default OpenData.extend({
  classNames: ['open-data-preview'],

  /**
   * For format reference see `util:dublin-core-xml-generator#groupedEntries`.
   * @override
   * @type {Array<{ type: String, value: String }>}
   */
  groupedEntries: computed('xml', function groupedEntries() {
    return get(
      dublinCoreXmlParser.create({ xmlSource: this.get('xml') }),
      'groupedEntries'
    );
  }),
});
