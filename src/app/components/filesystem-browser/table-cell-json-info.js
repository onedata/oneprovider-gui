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

export default Component.extend(I18n, {
  tagName: 'td',
  classNames: ['fb-table-col-json', 'multiline', 'hidden-xs'],
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
  maxTooltipLineLength: 20,

  /**
   * @type {number}
   */
  maxLineLength: 24,

  /**
   * @type {boolean}
   */
  isTooltipTextTruncated: false,

  /**
   * @type {boolean}
   */
  isTextTruncated: false,

  /**
   * @type {ComputedProperty<String>}
   */
  queryType: reads('columnInfo.queryType'),

  /**
   * @type {ComputedProperty<String>}
   */
  jsonKey: reads('columnInfo.jsonKey'),

  /**
   * @type {ComputedProperty<Object>}
   */
  json: reads('file.effFile.jsonMetadata'),

  /**
   * @type {ComputedProperty<String>}
   */
  selectedJsonData: computed(
    'queryType',
    'jsonKey',
    'json',
    function selectedJsonData() {
      const jsonObj = this.json;
      if (jsonObj === undefined) {
        return '';
      }
      if (this.queryType === 'all') {
        return JSON.stringify(jsonObj, null, 2);
      }
      if (!this.jsonKey || !jsonObj) {
        return '';
      }

      const selectedData = jsonObj[this.jsonKey];
      if (typeof selectedData === 'string') {
        return '"' + selectedData + '"';
      }
      return JSON.stringify(selectedData, null, 2);
    }
  ),

  tooltipJsonText: computed(
    'selectedJsonData',
    'tooltipMaxLines',
    'maxTooltipLineLength',
    function tooltipJsonText() {
      const lines = this.selectedJsonData.split('\n');

      let jsonText = '';
      let currentLineNumber = 0;

      for (const line of lines) {
        let remainingLineText = line;
        do {
          if (currentLineNumber > this.tooltipMaxLines) {
            this.set('isTooltipTextTruncated', true);
            jsonText = jsonText.replace(/\n$/g, '');
            return jsonText;
          }

          jsonText += remainingLineText.substring(0, this.maxTooltipLineLength) + '\n';
          currentLineNumber += 1;
          remainingLineText = remainingLineText.substring(this.maxTooltipLineLength);
        } while (remainingLineText.length > 0);
      }

      this.set('isTooltipTextTruncated', false);
      jsonText = jsonText.replace(/\n$/g, '');
      return jsonText;
    }
  ),

  jsonToShowInCell: computed('selectedJsonData', function jsonToShowInCell() {
    if (!this.selectedJsonData) {
      return;
    }

    const preFormattedText = this.selectedJsonData.substring(0, 500)
      .replace(/(\r\n|\n|\r)/gm, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const coloredText = Prism.highlight(preFormattedText, Prism.languages.json, 'json');
    const formattedText = coloredText.replace(/>(\r\n|\n|\r| )+</gm, '><');
    const textsAndIndexesArray = this.getTextsAndIndexes(formattedText);
    const closingSpanTag = '</span>';
    const maxSecondLineLength = this.maxLineLength - 1;

    let firstLine = '';
    let firstCountChars = 0;

    let startSecondPart = 0;
    let secondLine = '';
    let secondCountChars = 0;

    this.set('isTextTruncated', false);

    for (const [i, elem] of textsAndIndexesArray.entries()) {
      if (firstCountChars < this.maxLineLength) {
        if (firstCountChars + elem[1].length < this.maxLineLength) {
          firstCountChars += elem[1].length;
        } else {
          const currentText = elem[1].substring(0, this.maxLineLength - firstCountChars);
          const remainingText = elem[1].slice(this.maxLineLength - firstCountChars);
          firstLine = formattedText.substring(0, elem[0]) + currentText + closingSpanTag;
          startSecondPart = elem[0] + elem[1].length + closingSpanTag.length;
          firstCountChars = this.maxLineLength;

          if (remainingText) {
            secondCountChars = remainingText.length;
            let htmlBeforeText = '';
            let startIndex = 0;

            if (i - 1 >= 0) {
              startIndex = textsAndIndexesArray[i - 1][0] +
                textsAndIndexesArray[i - 1][1].length + closingSpanTag.length;
            }
            htmlBeforeText = formattedText.substring(startIndex, elem[0]);
            secondLine = htmlBeforeText +
              remainingText.substring(0, maxSecondLineLength) + closingSpanTag;

            if (secondCountChars > maxSecondLineLength) {
              this.set('isTextTruncated', true);
              break;
            }
          }
        }
      } else {
        if (secondCountChars + elem[1].length < maxSecondLineLength) {
          secondCountChars += elem[1].length;
        } else {
          const currentText = elem[1].substring(
            0, maxSecondLineLength - secondCountChars);
          secondLine += formattedText.substring(startSecondPart, elem[0]) +
            currentText + closingSpanTag;
          secondCountChars += elem[1].length;
          if (secondCountChars > maxSecondLineLength ||
            i < textsAndIndexesArray.length - 1) {
            this.set('isTextTruncated', true);
          }
          break;
        }
      }
    }

    if (secondCountChars > 0 && secondCountChars < maxSecondLineLength) {
      secondLine += formattedText.substring(startSecondPart);
    }
    if (!firstLine) {
      return [
        htmlSafe(formattedText),
      ];
    }

    if (!secondLine) {
      return [
        htmlSafe(firstLine),
      ];
    }

    return [
      htmlSafe(firstLine),
      htmlSafe(secondLine),
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

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
    copyJson(event) {
      event.stopPropagation();
      this.globalClipboard.copy(this.selectedJsonData);
    },
  },
});
