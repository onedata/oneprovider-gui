/**
 * Edit or view XML of DataCite share handle metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2025 ACK CYFRONET AGH
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
    this.locale = new Locale('components.shareShow.dataCite');
  }

  /**
   * @param {import('./pane-publicdata').PublicDataInitialMetadata} initialData
   * @returns {string}
   */
  @action
  generateInitialXml(initialData = {}) {
    const { creator = '', title = '', date } = initialData;
    const year = moment(date).format('YYYY');

    return `<?xml version="1.0" encoding="utf-8"?>
<!-- DataCite XML metadata; refer to: https://datacite-metadata-schema.readthedocs.io -->
<resource
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://datacite.org/schema/kernel-4"
  xsi:schemaLocation="http://datacite.org/schema/kernel-4 https://schema.datacite.org/meta/kernel-4/metadata.xsd"
>
    <creators>
        <creator>
            <creatorName>${creator}</creatorName>
        </creator>
    </creators>
    <titles>
      <title>${title}</title>
    </titles>
    <publisher>Example Publisher</publisher>
    <publicationYear>${year}</publicationYear>
    <resourceType resourceTypeGeneral="Dataset">Example Dataset</resourceType>
</resource>
`;
  }
}
