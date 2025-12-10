/**
 * Edit or view XML of OpenAIRE share handle metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2025 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Locale from 'onedata-gui-common/utils/locale';
import moment from 'moment';
import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class DataCiteComponent extends Component {
  constructor() {
    super(...arguments);
    this.locale = new Locale('components.shareShow.openAire');
  }

  /**
   * @param {import('./pane-publicdata').PublicDataInitialMetadata} initialData
   * @returns {string}
   */
  @action
  generateInitialXml(initialData = {}) {
    const {
      creator = '', title = '', date,
    } = initialData;
    const formattedDate = moment(date).format('YYYY-MM-DD');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- OpenAIRE XML metadata; refer to: https://openaire-guidelines-for-literature-repository-managers.readthedocs.io/en/v4.0.0/application_profile.html -->
<oaire:resource
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:datacite="http://datacite.org/schema/kernel-4"
 xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
 xmlns:oaire="http://namespace.openaire.eu/schema/oaire/"
 xsi:schemaLocation="http://namespace.openaire.eu/schema/oaire/ https://www.openaire.eu/schema/repo-lit/4.0/openaire.xsd">
    <datacite:titles>
        <datacite:title>${title}</datacite:title>
    </datacite:titles>
    <datacite:creators>
        <datacite:creator>
            <datacite:creatorName>${creator}</datacite:creatorName>
        </datacite:creator>
    </datacite:creators>
    <dc:language>eng</dc:language>
    <datacite:dates>
        <datacite:date dateType="Issued">${formattedDate}</datacite:date>
    </datacite:dates>
    <oaire:resourceType resourceTypeGeneral="literature" uri="http://purl.org/coar/resource_type/c_93fc">report</oaire:resourceType>
    <datacite:rights rightsURI="http://purl.org/coar/access_right/c_abf2">open access</datacite:rights>
</oaire:resource>`;
  }
}
