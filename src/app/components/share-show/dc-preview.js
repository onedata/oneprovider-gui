/**
 * Open Data viewer with visual (Dublin Core Metadata values render) and XML (raw text)
 * modes.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import { get, computed } from '@ember/object';
import dublinCoreXmlParser from 'oneprovider-gui/utils/dublin-core-xml-parser';
import Dc from './-dc';

export default Dc.extend({
  classNames: ['share-show-dc-preview'],

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
