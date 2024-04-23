/**
 * Dummy visual-edm-editor
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm/view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { exampleEdmValidXml as exampleXml } from 'oneprovider-gui/utils/mock-data';

export default Component.extend({
  init() {
    this._super(...arguments);
    // uncomment for initial metadata
    // const edmMetadata = EdmMetadataFactory.createInitialMetadata();
    const edmMetadata = EdmMetadataFactory.fromXml(exampleXml);
    this.set('visualEdmViewModel', VisualEdmViewModel.create({
      edmMetadata,
      validator: EdmMetadataValidator.create({ edmMetadata }),
      isReadOnly: true,
    }));
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.visualEdmViewModel?.validator?.destroy();
    this.visualEdmViewModel?.destroy();
  },

  actions: {
    generateXml() {
      console.log(this.visualEdmViewModel.edmMetadata.stringify());
    },
  },
});
