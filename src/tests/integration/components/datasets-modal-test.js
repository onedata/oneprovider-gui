/**
 * Tests only if file-datasets component is integrated with modal and modal features.
 *
 * @module tests/integration/components/datasets-modal-test
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
import $ from 'jquery';
import { click } from 'ember-native-dom-helpers';

describe('Integration | Component | datasets modal', function () {
  setupComponentTest('datasets-modal', {
    integration: true,
  });

  it('renders file-datasets with file name and invokes onHide on close', async function () {
    const fileDatasetSummary = {
      async getRelation() {
        return null;
      },
      belongsTo(relation) {
        if (relation === 'directDataset') {
          return { id: () => null };
        }
      },
    };
    this.setProperties({
      open: true,
      files: [{
        name: 'test-file.txt',
        async getRelation(relation) {
          if (relation === 'fileDatasetSummary') {
            return fileDatasetSummary;
          }
        },
      }],
      onHide: sinon.spy(),
    });
    this.render(hbs `{{datasets-modal open=open files=files onHide=onHide}}`);
    await wait();
    expect($('.datasets-modal.in')).to.exist;
    expect($('.datasets-modal.in .file-datasets')).to.exist;
    expect($('.modal-file-subheader .file-name')).to.contain('test-file.txt');
    expect(this.get('onHide')).to.have.not.been.called;
    await click('.close-btn');
    expect(this.get('onHide')).to.have.been.calledOnce;
  });
});
