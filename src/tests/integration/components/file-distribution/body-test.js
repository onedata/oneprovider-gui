import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find } from '@ember/test-helpers';
import { all as allSettled } from 'rsvp';
import Helper from '../../../helpers/file-distribution';

describe('Integration | Component | file-distribution/body', function () {
  setupRenderingTest();

  it('renders rows with provider names for single file', async function () {
    const helper = new Helper(this);
    await helper.givenSingleFileWithDistribution();
    helper.givenNoTransfersForSingleFile();

    await helper.renderBody();

    const oneprovidersDistribution = helper.getOneprovidersDistribution();
    expect(oneprovidersDistribution).to.exist;
    const providerItems = [...oneprovidersDistribution.querySelectorAll('.oneproviders-distribution-item')];
    expect(providerItems).to.have.lengthOf(2);
    expect(providerItems[0]).to.contain.text('Kraków');
    expect(providerItems[1]).to.contain.text('Paris');
  });
});
