/**
 * Wrapper for dataset model that adds API for browser components.
 * A dataset can be treated then as a file-like object.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BrowsableWrapper from 'oneprovider-gui/utils/browsable-wrapper';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default BrowsableWrapper.extend({
  type: reads('rootFileType'),

  effFile: computed(function effFile() {
    return this;
  }),

  browsableType: 'dataset',
});
