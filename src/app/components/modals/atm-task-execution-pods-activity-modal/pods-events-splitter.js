/**
 * Splits pods and events table with possibility to resize them.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import SplitGrid from 'split-grid';

export default Component.extend({
  classNames: ['pods-events-splitter'],

  /**
   * @virtual
   * @type {number}
   */
  gridTrackNumber: undefined,

  /**
   * @virtual optional
   * @type {() => void}
   */
  onMoveEnd: undefined,

  didInsertElement() {
    this._super(...arguments);

    const {
      element,
      gridTrackNumber,
    } = this.getProperties('element', 'gridTrackNumber');

    this.set('splitGrid', SplitGrid({
      rowGutters: [{
        track: gridTrackNumber,
        element,
      }],
      rowMinSizes: {
        0: 150,
        2: 150,
      },
      onDragEnd: () => {
        const onMoveEnd = this.get('onMoveEnd');
        if (onMoveEnd) {
          onMoveEnd();
        }
      },
    }));
  },

  willDestroyElement() {
    try {
      const splitGrid = this.get('splitGrid');
      if (splitGrid) {
        splitGrid.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },
});
