import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm/view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import { settled } from '@ember/test-helpers';

describe('Integration | Utility | visual-edm/view-model', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.viewModel?.destroy();
  });

  it('can be created without any condition', async function () {
    // given
    const edmMetadata = EdmMetadataFactory.createInitialMetadata();
    this.viewModel = VisualEdmViewModel.create({
      edmMetadata,
    });
    const propertyViewModels = [];
    for (const objectViewModel of this.viewModel.objects) {
      for (const groupViewModel of objectViewModel.edmPropertyGroups) {
        propertyViewModels.push(...groupViewModel.propertiesViewModels);
      }
    }

    // when
    this.viewModel.destroy();
    await settled();

    // then
    expect(propertyViewModels).to.be.not.empty;
    expect(this.viewModel.isDestroyed).to.be.true;
    for (const propertyViewModel of propertyViewModels) {
      expect(propertyViewModel.isDestroyed).to.be.true;
    }
  });
});
