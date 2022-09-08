import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find } from '@ember/test-helpers';
import { all as allSettled } from 'rsvp';
import Helper from '../../../helpers/file-distribution';
import { click } from '@ember/test-helpers';
import sleep from 'onedata-gui-common/utils/sleep';
import sinon from 'sinon';

describe('Integration | Component | file-distribution/body', function () {
  setupRenderingTest();

  it('renders rows with provider names for single file', async function () {
    const helper = new Helper(this);
    await helper.givenSingleFileWithDistribution();
    helper.givenNoTransfersForSingleFile();

    await helper.renderBody();

    const oneprovidersDistribution = helper.getOneprovidersDistribution();
    expect(oneprovidersDistribution).to.exist;
    const providerItems = [
      ...oneprovidersDistribution.querySelectorAll('.oneproviders-distribution-item'),
    ];
    expect(providerItems).to.have.lengthOf(2);
    expect(providerItems[0]).to.contain.text('Kraków');
    expect(providerItems[1]).to.contain.text('Paris');
  });

  it('invokes replication of file when "Replicate" action is used', async function () {
    const helper = new Helper(this);
    await helper.givenSingleFileWithDistribution();
    helper.givenNoTransfersForSingleFile();
    const startReplication = sinon.spy(helper.getTransferManager(), 'startReplication');
    const parisProvider = helper.providers[1];

    await helper.renderBody();
    const parisItem =
      helper.getOneproviderDistributionItem(parisProvider.get('entityId'));
    await click(parisItem.querySelector('.one-pill-button-actions-trigger'));
    const actionsPopover = find('.webui-popover.in');
    expect(actionsPopover).to.exist;
    const replicateAction =
      actionsPopover.querySelector('.replicate-here-action-trigger');
    await click(replicateAction);

    expect(startReplication).to.be.calledOnce;
    expect(startReplication).to.be.calledWith(
      helper.files[0],
      parisProvider
    );
  });
});
