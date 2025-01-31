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

export const emptyValue = { ___empty___: true };

export default Component.extend({
  tagName: 'td',
  classNames: ['fb-table-col-json', 'multiline', 'hidden-xs'],
  attributeBindings: ['style'],

  metadataManager: service(),
  globalClipboard: service(),

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

  jsonTooltipText: computed('json', function jsonText() {
    return htmlSafe(`<pre>${this.json}</pre>`);
  }),

  jsonText: computed('json', function jsonText() {
    return this.json.replace(/(\r\n|\n|\r| )/gm, '');
  }),

  fileJsonPart: computed('jsonText', function fileJsonPart() {
    const text = this.jsonText.substring(0, 49);
    const trimText = this.trimToEvenQuotes(text);

    const firstPart = trimText.substring(0, 24);
    const trimFirstPart = this.trimToEvenQuotes(firstPart);
    const firstPartTextLength = trimFirstPart.length;

    const secondPart = trimText.substring(
      firstPartTextLength,
      firstPartTextLength + 24,
    );
    const trimSecondPart = this.trimToEvenQuotes(secondPart);
    return [trimFirstPart, trimSecondPart];
  }),

  isWrapText: computed('fileJsonPart', function isWrapText() {
    return this.jsonText.length > 49 ||
      this.fileJsonPart[0].length + this.fileJsonPart[1].length < this.jsonText.length;
  }),

  trimToEvenQuotes(text) {
    const quoteCount = (text.match(/"/g) || []).length;

    if (quoteCount % 2 !== 0) {
      const lastQuoteIndex = text.lastIndexOf('"');
      if (lastQuoteIndex !== -1) {
        return text.substring(0, lastQuoteIndex);
      }
    }

    return text;
  },

  didRender() {
    this._super(...arguments);
    Prism.highlightAll();
  },

  actions: {
    copyJson() {
      this.globalClipboard.copy(this.json);
    },
  },
});
