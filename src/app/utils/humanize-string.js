import { capitalize, underscore } from '@ember/string';

export default function humanizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return capitalize(underscore(str)).replaceAll('_', ' ');
}
