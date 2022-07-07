import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import { registerService, lookupService } from '../../../helpers/stub-service';
import sinon from 'sinon';
import EmberPowerSelectHelper from '../../../helpers/ember-power-select-helper';

const TransferManager = Service.extend({
  getSpaceTransfersThroughputCharts() {},
});

class ProviderSelectHelper extends EmberPowerSelectHelper {
  constructor() {
    super('.chart-selectors');
  }
}

describe('Integration | Component | space transfers/throughput distribution', function () {
  setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'transferManager', TransferManager);
  });

  it('selects all oneproviders by default and allows to change it', async function () {
    const providerZ = {
      entityId: 'p1',
      name: 'Provider Z',
    };
    const providerA = {
      entityId: 'p2',
      name: 'Provider A',
    };

    this.setProperties({
      space: {},
      providers: [providerZ, providerA],
      providersColors: {},
      transferType: 'waiting',
      timeUnit: 'minute',
    });
    const transferManager = lookupService(this, 'transferManager');
    const getSpaceTransfersThroughputCharts =
      sinon.stub(transferManager, 'getSpaceTransfersThroughputCharts');
    getSpaceTransfersThroughputCharts.rejects();
    getSpaceTransfersThroughputCharts.withArgs(
      this.get('space'),
      this.get('transferType'),
      this.get('timeUnit'),
      undefined,
    ).resolves({});

    await render(hbs`{{space-transfers/throughput-distribution
      space=space
      providers=providers
      providersColors=providersColors
      transferType=transferType
      timeUnit=timeUnit
      updaterEnabled=false
    }}`);

    expect(find('.ember-power-select-selected-item')).to.contain.text(
      'All Oneproviders'
    );
    const select = new ProviderSelectHelper();
    // option 3 should be Provider Z
    return select.selectOption(3, () => {
      expect(find('.chart-selectors .ember-power-select-selected-item'))
        .to.contain.text(providerZ.name);
    });
  });

  it('preserves selection of all oneproviders when changing timespan', async function () {
    const providerZ = {
      entityId: 'p1',
      name: 'Provider Z',
    };

    this.setProperties({
      space: {},
      providers: [providerZ],
      providersColors: {},
      transferStatProviderId: undefined,
      transferType: 'waiting',
      timeUnit: 'minute',
    });
    const transferManager = lookupService(this, 'transferManager');
    const getSpaceTransfersThroughputCharts =
      sinon.stub(transferManager, 'getSpaceTransfersThroughputCharts');
    getSpaceTransfersThroughputCharts.rejects();
    getSpaceTransfersThroughputCharts.withArgs(
      this.get('space'),
      this.get('transferType'),
      this.get('timeUnit'),
      undefined,
    ).resolves({});

    await render(hbs`{{space-transfers/throughput-distribution
      space=space
      providers=providers
      providersColors=providersColors
      transferType=transferType
      timeUnit=timeUnit
      updaterEnabled=false
    }}`);

    expect(find('.ember-power-select-selected-item')).to.contain.text(
      'All Oneproviders'
    );
    this.set('timeUnit', 'hour');
    settled();

    expect(find('.ember-power-select-selected-item')).to.contain.text(
      'All Oneproviders'
    );
  });
});
