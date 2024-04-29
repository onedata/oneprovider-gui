/**
 * Exports options for language dropdown of EDM property. The option contains translated
 * name of the language and IETF BCP 47 language tag. The exported options are the popular
 * subset of these codes (list from Wikipedia).
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { t } from 'onedata-gui-common/utils/i18n/t';

/**
 * @param {Array<string>} langCodes
 * @returns {Array<{ label: string, value: string }>}
 */
function createLangSelectorSpec(langCodes) {
  return [
    { label: t('utils.propertySpec.lang.default'), value: '' },
    ...langCodes.map(value => ({ label: t(`utils.propertySpec.lang.${value}`), value })),
  ];
}

const langCodes = [
  'af',
  'am',
  'ar',
  'arn',
  'as',
  'az',
  'ba',
  'be',
  'bg',
  'bn',
  'bo',
  'br',
  'bs',
  'ca',
  'co',
  'cs',
  'cy',
  'da',
  'de',
  'dsb',
  'dv',
  'el',
  'en',
  'es',
  'et',
  'eu',
  'fa',
  'fi',
  'fil',
  'fo',
  'fr',
  'fy',
  'ga',
  'gd',
  'gl',
  'gsw',
  'gu',
  'ha',
  'he',
  'hi',
  'hr',
  'hrv',
  'hsb',
  'hu',
  'hy',
  'id',
  'ig',
  'ii',
  'is',
  'it',
  'iu',
  'ja',
  'ka',
  'kk',
  'kl',
  'km',
  'kn',
  'ko',
  'kok',
  'kb',
  'ky',
  'lb',
  'lo',
  'lt',
  'lv',
  'mi',
  'mk',
  'ml',
  'mn',
  'moh',
  'mr',
  'ms',
  'mt',
  'my',
  'nb',
  'ne',
  'nl',
  'nn',
  'no',
  'oc',
  'or',
  'pa',
  'pl',
  'prs',
  'ps',
  'pt',
  'quc',
  'qu',
  'rm',
  'ro',
  'ru',
  'rw',
  'sa',
  'sah',
  'se',
  'si',
  'sk',
  'sl',
  'sma',
  'smj',
  'smn',
  'sms',
  'sq',
  'sr',
  'st',
  'sv',
  'sw',
  'syc',
  'ta',
  'te',
  'tg',
  'th',
  'tk',
  'tn',
  'tr',
  'tt',
  'tzm',
  'ug',
  'uk',
  'ur',
  'uz',
  'vi',
  'wo',
  'xh',
  'yo',
  'zh',
  'zu',
];

let langSelectorSpec;

export function getLangSelectorOptions() {
  if (!langSelectorSpec) {
    langSelectorSpec = createLangSelectorSpec(langCodes);
  }
  return langSelectorSpec;
}
