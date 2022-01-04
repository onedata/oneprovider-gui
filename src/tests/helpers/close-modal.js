/**
 * Modal closing helpers
 *
 * @module tests/helpers/close-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import wait from 'ember-test-helpers/wait';

export async function closeModalUsingBackground() {
  document.querySelector('.modal').click();
  return wait();
}
