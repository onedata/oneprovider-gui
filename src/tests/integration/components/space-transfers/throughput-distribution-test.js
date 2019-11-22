import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import { registerService, lookupService } from '../../../helpers/stub-service';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
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
  setupComponentTest('space-transfers/throughput-distribution', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'transferManager', TransferManager);
  });

  it('selects all oneproviders by default and allows to change it', function () {
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
      transferStatProviderId: undefined,
      transferType: 'waiting',
      timeUnit: 'minute',
    });
    this.on('selectTransferStatProvider', (id) => {
      this.set('transferStatProviderId', id);
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

    this.render(hbs `{{space-transfers/throughput-distribution
      space=space
      providers=providers
      providersColors=providersColors
      transferStatProviderId=transferStatProviderId
      selectTransferStatProvider=(action "selectTransferStatProvider")
      transferType=transferType
      timeUnit=timeUnit
      updaterEnabled=false
    }}`);

    return wait().then(() => {
      expect(this.$('.ember-power-select-selected-item').text()).to.contain(
        'All Oneproviders'
      );
      const select = new ProviderSelectHelper();
      // option 3 should be Provider Z
      return select.selectOption(3, () => {
        expect(
          this.$(
            '.chart-selectors .ember-power-select-selected-item'
          ).text()
        ).to.contain(providerZ.name);
      });
    });
  });

  it('preserves selection of all oneproviders when changing timespan', function () {
    const providerZ = {
      entityId: 'p1',
      name: 'Provider Z',
    };

    this.setProperties({
      space: {},
      providers: [providerZ],
      providersColors: {},
      selectTransferStatProviderId: (id) =>
        this.set('selectTransferStatProvider', id),
      transferStatProviderId: undefined,
      transferType: 'waiting',
      timeUnit: 'minute',
    });
    this.on('selectTransferStatProvider', (id) => {
      this.set('transferStatProviderId', id);
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

    this.render(hbs `{{space-transfers/throughput-distribution
      space=space
      providers=providers
      providersColors=providersColors
      transferStatProviderId=transferStatProviderId
      selectTransferStatProvider=(action "selectTransferStatProvider")
      transferType=transferType
      timeUnit=timeUnit
      updaterEnabled=false
    }}`);

    return wait().then(() => {
        expect(this.$('.ember-power-select-selected-item').text()).to.contain(
          'All Oneproviders'
        );
        this.set('timeUnit', 'hour');
        return wait();
      })
      .then(() => {
        expect(this.$('.ember-power-select-selected-item').text()).to.contain(
          'All Oneproviders'
        );
      });
  });
});
