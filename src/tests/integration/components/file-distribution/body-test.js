import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find } from '@ember/test-helpers';
import Helper from '../../../helpers/file-distribution';
import { click } from '@ember/test-helpers';
import sinon from 'sinon';

describe('Integration | Component | file-distribution/body', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.helper?.destroy();
  });

  it('renders rows with provider names for single file', async function () {
    this.helper = new Helper(this);
    await this.helper.givenSingleFileWithDistribution();
    this.helper.givenNoTransfersForSingleFile();

    await this.helper.renderBody();

    const oneprovidersDistribution = this.helper.getOneprovidersDistribution();
    expect(oneprovidersDistribution).to.exist;
    const providerItems = [
      ...oneprovidersDistribution.querySelectorAll('.oneproviders-distribution-item'),
    ];
    expect(providerItems).to.have.lengthOf(2);
    expect(providerItems[0]).to.contain.text('Kraków');
    expect(providerItems[1]).to.contain.text('Paris');
  });

  it('invokes replication of file when "Replicate" action is used', async function () {
    this.helper = new Helper(this);
    await this.helper.givenSingleFileWithDistribution();
    this.helper.givenNoTransfersForSingleFile();
    const startReplication = sinon.spy(this.helper.getTransferManager(), 'startReplication');
    const parisProvider = this.helper.providers[1];

    await this.helper.renderBody();
    const parisItem =
      this.helper.getOneproviderDistributionItem(parisProvider.get('entityId'));
    await click(parisItem.querySelector('.one-pill-button-actions-trigger'));
    const actionsPopover = find('.webui-popover.in');
    expect(actionsPopover).to.exist;
    const replicateAction =
      actionsPopover.querySelector('.replicate-here-action-trigger');
    await click(replicateAction);

    expect(startReplication).to.be.calledOnce;
    expect(startReplication).to.be.calledWith(
      this.helper.files[0],
      parisProvider
    );
  });
});
