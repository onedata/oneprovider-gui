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
import _ from 'lodash';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
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

  /**
   * @virtual
   * @type {ComputedProperty<boolean>}
   */
  previewMode: undefined,

  queryType: reads('columnInfo.queryType'),

  jsonKey: reads('columnInfo.jsonKey'),

  jsonProxy: computed('file', 'previewMode', function jsonProxy() {
    const scope = this.previewMode ? 'public' : 'private';
    const promise = (async () => {
      try {
        const metadata = await this.metadataManager
          .getMetadata(this.file, 'json', scope);
        if (_.isEmpty(metadata)) {
          return '';
        } else {
          return metadata;
        }
      } catch (error) {
        const isNoDataError = error && error.id === 'posix' &&
          error.details && error.details.errno === 'enodata';
        if (isNoDataError) {
          return '';
        } else {
          throw error;
        }
      }
    })();
    return promiseObject(promise);
  }),

  json: reads('jsonProxy.content'),

  rawJson: computed(
    'queryType',
    'jsonKey',
    'json',
    function rawJson() {
      if (this.queryType === 'all') {
        return this.json;
      }
      if (!this.jsonKey || !this.json) {
        return '';
      }
      const jsonObj = JSON.parse(this.json);
      if (typeof jsonObj[this.jsonKey] === 'string') {
        return '"' + jsonObj[this.jsonKey] + '"';
      }
      return jsonObj[this.jsonKey];
    }
  ),

  jsonTooltipText: computed('rawJson', function jsonTooltipText() {
    let text = this.rawJson;
    if (typeof text === 'object') {
      text = JSON.stringify(text, null, 2);
    }
    return htmlSafe(`<pre>${text}</pre>`);
  }),

  isWrapText: false,

  jsonToShowInCell: computed('rawJson', function jsonToShowInCell() {
    let trimmedText = this.rawJson;
    if (!this.rawJson) {
      return;
    }
    if (this.queryType === 'key' && typeof this.rawJson === 'object') {
      trimmedText = JSON.stringify(this.rawJson);
    } else if (this.queryType === 'key') {
      if (this.rawJson.length > 24) {
        this.set('isWrapText', this.rawJson.length > 48);
        return [
          this.rawJson.substring(0, 24),
          this.rawJson.substring(24, 48),
        ];
      } else {
        this.set('isWrapText', false);
        return [this.rawJson];
      }
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
          if (chunk2.length < 23) {
            secondCountChars = chunk2.length;
            let tmp = '';
            if (i - 1 >= 0) {
              const t = textsAndIndexesArray[i - 1][0] +
                textsAndIndexesArray[i - 1][1].length + 7;
              tmp = formattedText.substring(t, elem[0]);
            } else {
              tmp = formattedText.substring(0, elem[0]);
            }
            //
            secondPart = tmp + chunk2 + '</span>';
          } else {
            secondCountChars = chunk2.length;
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
          this.set('isWrapText', true);
          break;
        } else {
          let chunk = elem[1].substring(0, 23 - secondCountChars);
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
    let currentIndex = 0;

    while ((match = regex.exec(htmlString)) !== null) {
      if (match[1].trim().length > 0) {
        const startIndex = htmlString.indexOf(match[1], currentIndex);
        texts.push([startIndex, match[1]]);
        currentIndex = startIndex + match[1].length;
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
