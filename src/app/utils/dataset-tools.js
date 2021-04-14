/**
 * Common logic utils for datasets components
 *
 * @module utils/dataset-tools
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';

export function hasProtectionFlag(flagsProperty, flagType) {
  return computed(`${flagsProperty}.[]`, function hadProtectionFlag() {
    const flags = this.get(flagsProperty);
    if (flags) {
      return flags.includes(`${flagType}_protection`);
    } else {
      return false;
    }
  });
}
