/**
 * Wrapper for archive model that adds API for browser components.
 * An archive can be treated then as a file-like object.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';
import { dateFormat } from 'onedata-gui-common/helpers/date-format';

export default BrowsableWrapper.extend({
  descriptionMaxLength: 32,

  type: 'dir',

  browsableType: 'archive',

  name: computed('content.creationTime', function name() {
    const creationTime = this.get('content.creationTime');
    return dateFormat([creationTime], {
      format: 'dateWithMinutes',
      blank: '—',
    });
  }),

  effFile: computed(function effFile() {
    return this;
  }),

  extraName: reads('content.description'),
});
