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

export const emptyValue = { ___empty___: true };

export default Component.extend({
  tagName: 'td',
  classNames: ['fb-table-col-json', 'multiline', 'hidden-xs'],
  attributeBindings: ['style'],

  metadataManager: service(),
  globalClipboard: service(),

  /**
   * @virtual
   * @type {ColumnProperties}
   */
  columnInfo: undefined,

  /**
   * @virtual
   * @type {(item: any, actionName: string) => void}
   */
  invokeFileAction: notImplementedReject,

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

  queryType: reads('columnInfo.queryType'),

  jsonKey: reads('columnInfo.jsonKey'),

  json: reads('file.effFile.jsonMetadata'),

  rawJson: computed(
    'queryType',
    'jsonKey',
    'json',
    function rawJson() {
      const jsonObj = this.json;
      if (jsonObj === undefined || Object.keys(jsonObj).length === 0) {
        return '';
      }
      if (this.queryType === 'all') {
        return JSON.stringify(this.json, null, 2);
      }
      if (!this.jsonKey || !this.json) {
        return '';
      }

      if (typeof jsonObj[this.jsonKey] === 'string') {
        return '"' + jsonObj[this.jsonKey] + '"';
      }
      return JSON.stringify(jsonObj[this.jsonKey], null, 2);
    }
  ),

  isTooltipWrap: false,

  jsonTooltipText: computed('rawJson', function jsonTooltipText() {
    let text = this.rawJson;
    let result = '';
    const maxLines = 12;
    const maxLenLine = 20;
    if (typeof text === 'object') {
      text = JSON.stringify(text, null, 2);
    }

    const lines = text.split('\n');
    let i = 0;

    for (const line of lines) {
      if (i > maxLines) {
        result = result.replace(/\n$/g, '');
        this.set('isTooltipWrap', true);
        return result;
      }
      result += line.substring(0, maxLenLine) + '\n';
      i += 1;
      let tmpLine = line.substring(maxLenLine);
      while (tmpLine.length > maxLenLine) {
        if (i > maxLines) {
          result = result.replace(/\n$/g, '');
          this.set('isTooltipWrap', true);
          return result;
        }
        result += tmpLine.substring(0, maxLenLine) + '\n';
        i += 1;
        tmpLine = tmpLine.substring(maxLenLine);
      }
      if (tmpLine.length > 0) {
        result += tmpLine + '\n';
      }
    }
    this.set('isTooltipWrap', false);
    result = result.replace(/\n$/g, '');
    return result;
  }),

  isWrapText: false,

  jsonToShowInCell: computed('rawJson', function jsonToShowInCell() {
    const trimmedText = this.rawJson;
    if (!trimmedText) {
      return;
    }

    trimmedText.substring(0, 500).replace(/(\r\n|\n|\r)/gm, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const coloredText = Prism.highlight(trimmedText, Prism.languages.json, 'json');
    const formattedText = coloredText.replace(/>(\r\n|\n|\r| )+</gm, '><');
    const textsAndIndexesArray = this.getTextsAndIndexes(formattedText);

    let firstPart = '';
    let firstCountChars = 0;
    let startSecondPart = 0;
    let secondPart = '';
    let secondCountChars = 0;
    for (const [i, elem] of textsAndIndexesArray.entries()) {
      if (firstCountChars < 24) {
        if (firstCountChars + elem[1].length < 24) {
          firstCountChars += elem[1].length;
        } else if (firstCountChars + elem[1].length === 24) {
          firstPart = formattedText.substring(0, elem[0] + elem[1].length) + '</span>';
          firstCountChars += elem[1].length;
          startSecondPart = elem[0] + elem[1].length + 7;
        } else {
          const chunk1 = elem[1].substring(0, 24 - firstCountChars);
          const chunk2 = elem[1].slice(24 - firstCountChars);
          firstPart = formattedText.substring(0, elem[0]) + chunk1 + '</span>';
          startSecondPart = elem[0] + elem[1].length + 7;
          firstCountChars = 24;
          secondCountChars = chunk2.length;
          if (secondCountChars < 23) {
            let tmp = '';
            if (i - 1 >= 0) {
              const t = textsAndIndexesArray[i - 1][0] +
                textsAndIndexesArray[i - 1][1].length + 7;
              tmp = formattedText.substring(t, elem[0]);
            } else {
              tmp = formattedText.substring(0, elem[0]);
            }
            secondPart = tmp + chunk2 + '</span>';
          } else {
            let tmp = '';
            if (i - 1 >= 0) {
              const t = textsAndIndexesArray[i - 1][0] +
                textsAndIndexesArray[i - 1][1].length + 7;
              tmp = formattedText.substring(t, elem[0]);
            } else {
              tmp = formattedText.substring(0, elem[0]);
            }
            secondPart = tmp + chunk2.substring(0, 23) + '</span>';
            this.set('isWrapText', true);
            break;
          }
        }
      } else {
        if (secondCountChars + elem[1].length < 23) {
          secondCountChars += elem[1].length;
        } else if (secondCountChars + elem[1].length === 23) {
          secondPart += formattedText.substring(startSecondPart, elem[0] + elem[1].length) + '</span>';
          secondCountChars = 23;
          if (i !== textsAndIndexesArray.length - 1) {
            this.set('isWrapText', true);
          }

          break;
        } else {
          const chunk = elem[1].substring(0, 23 - secondCountChars);
          secondPart += formattedText.substring(startSecondPart, elem[0]) + chunk + '</span>';
          secondCountChars = 23;
          this.set('isWrapText', true);
          break;
        }
      }
    }

    if (secondCountChars > 0 && secondCountChars < 23) {
      this.set('isWrapText', false);
      secondPart += formattedText.slice(startSecondPart);
    }
    if (!firstPart) {
      this.set('isWrapText', false);
      return [
        htmlSafe(formattedText),
      ];
    }

    if (!secondPart) {
      this.set('isWrapText', false);
      return [
        htmlSafe(firstPart),
      ];
    }

    return [
      htmlSafe(firstPart),
      htmlSafe(secondPart),
    ];
  }),

  getTextsAndIndexes(htmlString) {
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

  didRender() {
    this._super(...arguments);
  },

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
    copyJson(event) {
      event.stopPropagation();
      this.globalClipboard.copy(this.json);
    },
  },
});
