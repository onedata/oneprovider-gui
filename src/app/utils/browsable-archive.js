/**
 * Wrapper for archive model that adds API for browser components.
 * An archive can be treated then as a file-like object.
 *
 * @module utils/browsable-archive
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

export default BrowsableWrapper.extend({
  descriptionMaxLength: 32,

  type: 'dir',

  name: computed('content.creationTime', function name() {
    const creationTime = this.get('content.creationTime');
    return dateFormat([creationTime], {
      format: 'dateWithMinutes',
      blank: '—',
    });
  }),

  extendedName: computed('name', function extendedName() {
    const description = this.get('content.description');
    const {
      name,
      descriptionMaxLength,
    } = this.getProperties('name', 'descriptionMaxLength');
    if (description) {
      let shortDescription;
      if (description.length > descriptionMaxLength) {
        shortDescription = description.slice(0, descriptionMaxLength) + '…';
      } else {
        shortDescription = description;
      }
      return `${name} — ${shortDescription}`;
    } else {
      return name;
    }
  }),

  effFile: computed(function effFile() {
    return this;
  }),

  browsableType: 'archive',
});
