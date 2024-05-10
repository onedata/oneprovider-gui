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
   * DC preview can be rendered both in authenticated or unauthenticated (public) mode.
   * Set to true if it is rendered in public mode to hide some features.
   * @virtual optional
   * @type {boolean}
   */
  isPublicView: false,

  /**
   * @virtual optional
   * @type {(isEditMode: boolean) => void}
   */
  onChangeEditMode: undefined,

  /**
   * For format reference see `util:dublin-core-xml-generator#groupedEntries`.
   * @override
   * @type {Array<{ type: String, value: String }>}
   */
  groupedEntries: computed('xmlValue', function groupedEntries() {
    return get(
      dublinCoreXmlParser.create({ xmlSource: this.get('xmlValue') }),
      'groupedEntries'
    );
  }),

  actions: {
    startModify() {
      this.onChangeEditMode?.(true);
    },
  },
});
