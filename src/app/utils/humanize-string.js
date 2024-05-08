/**
 * Produces string looking like the sentence, eg. "helloBeautifulWorld" ->
 * "Hello beautiful world".
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { capitalize, underscore } from '@ember/string';

export default function humanizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return capitalize(underscore(str)).replaceAll('_', ' ');
}
