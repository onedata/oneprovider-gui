/**
 * Renders visualization of file chunks presence.
 * 
 * @module components/file-distribution-modal/chunks-visualizer
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend(I18n, {
  classNames: ['chunks-visualizer'],
  classNameBindings: ['neverSynchronized:never-synchronized:synchronized'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDistributionModal.chunksVisualizer',

  /**
   * @virtual
   * @type {boolean}
   */
  neverSynchronized: false,

  /**
   * @virtual
   * @type {Object}
   */
  chunks: undefined,

  /**
   * @virtual
   * @type {number}
   */
  percentage: undefined,

  /**
   * @virtual
   * @type {number}
   */
  fileSize: undefined,

  /**
   * @virtual
   * @type {number}
   */
  chunksRange: undefined,

  /**
   * @type {string}
   */
  chunksColor: '#4BD187',

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  percentageText: computed('percentage', function percentageText() {
    const percentage = this.get('percentage');
    return percentage !== undefined ? `${Math.floor(percentage)}%` : '';
  }),

  canvasModifier: observer(
    'neverSynchronized',
    'chunksRange',
    'chunks',
    function canvasModifier() {
      scheduleOnce('afterRender', this, 'redrawCanvas');
    }
  ),

  didInsertElement() {
    this._super(...arguments);

    this.redrawCanvas();
  },

  getCanvas() {
    const element = this.get('element');
    return element ? element.querySelector('.chunks-canvas') : undefined;
  },

  /**
   * @returns {undefined}
   */
  redrawCanvas() {
    const canvas = this.getCanvas();
    if (!this.get('neverSynchronized') && canvas) {
      const {
        chunks,
        chunksRange,
        chunksColor,
      } = this.getProperties('chunks', 'chunksRange', 'chunksColor');
      const context = canvas.getContext('2d');

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate start point for each chunk
      const chunkStarts = chunks ? Object.keys(chunks).map(x => parseFloat(x)) : [];
      chunkStarts.sort((x, y) => x - y);
      let chunksNumber = chunkStarts.length;
      if (chunksNumber && chunkStarts[chunksNumber - 1] !== chunksRange) {
        chunkStarts.push(chunksRange);
        chunksNumber++;
      }

      for (let i = 0; i < chunkStarts.length - 1; i++) {
        // Calculate coordinates and opacity for chunk
        const startPixel = chunkStarts[i];
        const endPixel = chunkStarts[i + 1];
        const percentage = chunks[startPixel];
        const opacity = percentage <= 0 ? 0 : (percentage * 0.9 + 10) / 100;

        // Draw chunk
        context.globalAlpha = opacity;
        context.fillStyle = chunksColor;
        context.fillRect(startPixel, 0, endPixel - startPixel, canvas.height);
      }
    }
  },
});
