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
