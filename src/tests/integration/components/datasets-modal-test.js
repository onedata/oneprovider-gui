/**
 * Tests only if file-datasets component is integrated with modal and modal features.
 *
 * @module tests/integration/components/datasets-modal-test
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
import { createMockFileDatasetSummary } from '../../helpers/datasets-archives';
import { closeModalUsingBackground } from '../../helpers/modal';

describe('Integration | Component | datasets modal', function () {
  setupRenderingTest();

  it('renders file-datasets with file name and invokes onHide on close', async function () {
    const fileDatasetSummary = createMockFileDatasetSummary();
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
    await render(hbs `{{datasets-modal open=open files=files onHide=onHide}}`);
    await wait();
    const modal = document.querySelector('.datasets-modal.in');
    expect(modal).to.exist;
    expect(modal.querySelector('.file-datasets-modal-header')).to.exist;
    expect(modal.querySelector('.modal-file-subheader .file-name'))
      .to.contain.text('test-file.txt');
    expect(this.get('onHide')).to.have.not.been.called;
    await closeModalUsingBackground();
    expect(this.get('onHide')).to.have.been.calledOnce;
  });
});
