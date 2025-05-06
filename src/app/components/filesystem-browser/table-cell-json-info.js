/**
 * Renders table cell with specific json info
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2025 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import I18n from 'onedata-gui-common/mixins/i18n';
import jsonata from 'jsonata';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['table-cell-json-info', 'multiline', 'hidden-xs'],
  attributeBindings: ['style'],

  globalClipboard: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableCellJsonInfo',

  /**
   * @virtual
   * @type {ColumnProperties}
   */
  columnInfo: undefined,

  /**
   * @virtual
   * @type {string}
   */
  style: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {(item: any, actionName: string) => void}
   */
  invokeFileAction: notImplementedReject,

  /**
   * @type {number}
   */
  tooltipMaxLines: 12,

  /**
   * @type {number}
   */
  maxTooltipLineLength: 30,

  /**
   * @type {number}
   */
  maxLineLength: 24,

  /**
   * @type {ComputedProperty<JsonQueryType>}
   */
  queryType: reads('columnInfo.options.queryType'),

  /**
   * @type {ComputedProperty<string>}
   */
  jsonKey: reads('columnInfo.options.jsonKey'),

  /**
   * @type {ComputedProperty<string>}
   */
  jsonQuery: reads('columnInfo.options.jsonQuery'),

  /**
   * @type {ComputedProperty<Object>}
   */
  json: reads('file.effFile.jsonMetadata'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasJsonMetadata: reads('file.effFile.hasJsonMetadata'),

  /**
   * Depending on the query type, contains the entire JSON object as a string or
   * contains the value of the top-level key as a string.
   * @type {PromiseObject<string>}
   */
  selectedJsonStringProxy: computed(
    'queryType',
    'jsonKey',
    'jsonQuery',
    'json',
    'hasJsonMetadata',
    function selectedJsonStringProxy() {
      return promiseObject(this.resolveSelectedJsonString());
    }
  ),

  async resolveSelectedJsonString() {
    const jsonObj = this.json;
    if (!this.hasJsonMetadata || jsonObj === undefined) {
      return '';
    }
    if (this.queryType === 'all') {
      return this.stringifyJson(jsonObj);
    }
    if (this.queryType === 'key') {
      if (!this.jsonKey || !jsonObj) {
        return '';
      }
      const selectedData = jsonObj[this.jsonKey];
      return this.stringifyJson(selectedData);
    }
    if (this.queryType === 'query') {
      if (!this.jsonQuery || !jsonObj) {
        return '';
      }
      const expr = jsonata(this.jsonQuery);
      const result = await expr.evaluate(jsonObj);
      return this.stringifyJson(result);
    }
  },

  selectedJsonString: reads('selectedJsonStringProxy.content'),

  /**
   * @type {ComputedProperty<{ text: string, isTruncated: boolean }>}
   */
  tooltipSpec: computed(
    'selectedJsonString',
    'tooltipMaxLines',
    'maxTooltipLineLength',
    function tooltipSpec() {
      const lines = this.selectedJsonString.split('\n');

      let jsonText = '';
      let currentLineNumber = 0;
      let currentFragment = '';

      for (const line of lines) {
        let remainingLineText = line;
        do {
          if (currentLineNumber > this.tooltipMaxLines) {
            jsonText = jsonText.replace(/\n$/g, '');
            return {
              text: jsonText,
              isTruncated: true,
            };
          }
          currentFragment = remainingLineText.substring(0, this.maxTooltipLineLength);
          remainingLineText = remainingLineText.substring(this.maxTooltipLineLength);
          if (
            remainingLineText.startsWith(': {') ||
            remainingLineText.startsWith(': [') ||
            remainingLineText.startsWith(': "')
          ) {
            currentFragment += remainingLineText.substring(0, 3);
            remainingLineText = remainingLineText.substring(3);
          }
          jsonText += currentFragment + '\n';
          currentLineNumber += 1;
        } while (remainingLineText.length > 0);
      }

      jsonText = jsonText.replace(/\n$/g, '');
      return {
        text: jsonText,
        isTruncated: false,
      };
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  tooltipJsonText: reads('tooltipSpec.text'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isTooltipTextTruncated: reads('tooltipSpec.isTruncated'),

  /**
   * @type {ComputedProperty<{ lines: Array<string>, isTruncated: boolean }>}
   */
  htmlContentSpec: computed('selectedJsonString', function htmlContentSpec() {
    if (!this.selectedJsonString) {
      return {
        lines: [],
        isTruncated: false,
      };
    }
    const preFormattedText = this.selectedJsonString
      .replace(/(\r\n|\n|\r)/gm, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const coloredText = Prism.highlight(preFormattedText, Prism.languages.json, 'json');
    const formattedText = coloredText.replace(/>(\r\n|\n|\r| )+</gm, '><');
    const textsAndIndexesArray = this.getTokensAndIndexes(formattedText);
    const closingSpanTag = '</span>';
    const maxSecondLineLength = this.maxLineLength - 1;

    let firstLine = '';
    let firstCountChars = 0;

    let startSecondPart = 0;
    let secondLine = '';
    let secondCountChars = 0;

    let isTruncated = false;

    for (const [i, [startIndex, text]] of textsAndIndexesArray.entries()) {
      if (firstCountChars < this.maxLineLength) {
        if (firstCountChars + text.length < this.maxLineLength) {
          firstCountChars += text.length;
        } else {
          const currentText = text.substring(0, this.maxLineLength - firstCountChars);
          const remainingText = text.slice(this.maxLineLength - firstCountChars);
          firstLine =
            formattedText.substring(0, startIndex) + currentText + closingSpanTag;
          startSecondPart = startIndex + text.length + closingSpanTag.length;
          firstCountChars = this.maxLineLength;

          if (remainingText) {
            secondCountChars = remainingText.length;
            let htmlBeforeText = '';
            let secondLineStartIndex = 0;

            if (i - 1 >= 0) {
              secondLineStartIndex = textsAndIndexesArray[i - 1][0] +
                textsAndIndexesArray[i - 1][1].length + closingSpanTag.length;
            }
            htmlBeforeText = formattedText.substring(secondLineStartIndex, startIndex);
            secondLine = htmlBeforeText +
              remainingText.substring(0, maxSecondLineLength) + closingSpanTag;

            if (secondCountChars > maxSecondLineLength) {
              isTruncated = true;
              break;
            }
          }
        }
      } else {
        if (secondCountChars + text.length < maxSecondLineLength) {
          secondCountChars += text.length;
        } else {
          const currentText = text.substring(
            0,
            maxSecondLineLength - secondCountChars,
          );
          secondLine += formattedText.substring(startSecondPart, startIndex) +
            currentText + closingSpanTag;
          secondCountChars += text.length;
          if (secondCountChars > maxSecondLineLength ||
            i < textsAndIndexesArray.length - 1
          ) {
            isTruncated = true;
          }
          break;
        }
      }
    }

    if (secondCountChars > 0 && secondCountChars < maxSecondLineLength) {
      secondLine += formattedText.substring(startSecondPart);
    }
    if (!firstLine) {
      return {
        lines: [htmlSafe(formattedText)],
        isTruncated,
      };
    }

    if (!secondLine) {
      return {
        lines: [htmlSafe(firstLine)],
        isTruncated,
      };
    }

    return {
      lines: [
        htmlSafe(firstLine),
        htmlSafe(secondLine),
      ],
      isTruncated,
    };
  }),

  /**
   * @type {ComputedProperty<Array<string>>}
   */
  htmlContentLines: reads('htmlContentSpec.lines'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isTextTruncated: reads('htmlContentSpec.isTruncated'),

  /**
   * Extracts all visible text from an HTML string and
   * returns their starting indices.
   * @param {string} htmlString
   * @returns {Array<Array<[number, string]>>} An array of two-element arrays, where
   *  first element is starting index of the text within html string,
   *  and second element is extracted visible text.
   */
  getTokensAndIndexes(htmlString) {
    const texts = [];
    const regex = /<span[^>]*>(.*?)<\/span>/g;
    let match;

    while ((match = regex.exec(htmlString)) !== null) {
      if (match[1].trim().length > 0) {
        const startIndex = match.index + match[0].lastIndexOf(match[1]);
        texts.push([startIndex, match[1]]);
      }
    }
    return texts;
  },

  stringifyJson(json) {
    return JSON.stringify(json, null, 2);
  },

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.invokeFileAction(file, btnId, ...args);
    },
    copyJson(event) {
      event.stopPropagation();
      this.globalClipboard.copy(this.selectedJsonString);
    },
  },
});
