/**
 * Initializes moment-duration plugin for moment.js.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

export default {
  name: 'moment-duration-setup',

  initialize: function () {
    momentDurationFormatSetup(moment);
  },
};
