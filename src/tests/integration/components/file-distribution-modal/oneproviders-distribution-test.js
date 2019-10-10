import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import EmberObject, { set } from '@ember/object';
import sinon from 'sinon';
import $ from 'jquery';
import { click } from 'ember-native-dom-helpers';
import { Promise } from 'rsvp';
import wait from 'ember-test-helpers/wait';

/**
 * @param {Object} distributionParams
 *   { type: file|dir, onKrakow: percentage, onParis: percentage}
 * @returns {EmberObject}
 */
function createFileDistributionContainerStub({ type, onKrakow, onParis } = {}) {
  type = type || 'file';
  onKrakow = onKrakow || 50;
  onParis = onParis || 0;

  return EmberObject.create({
    fileType: type,
    fileSize: 1024,
    isFileDistributionLoaded: true,
    fileDistribution: {
      providerkrk: onKrakow ? {
        blocksPercentage: onKrakow,
        chunksBarData: {
          0: onKrakow,
        },
      } : undefined,
      providerpar: onParis ? {
        blocksPercentage: onParis,
        chunksBarData: {
          0: onParis,
        },
      } : undefined,
    },
    getDistributionForOneprovider(oneprovider) {
      return this.get(`fileDistribution.${oneprovider.entityId}`);
    },
  });
}

const oneproviderKrakow = Object.freeze({
  id: 'op_provider.providerkrk.instance:private',
  entityId: 'providerkrk',
  name: 'krakow',
});

const oneproviderParis = Object.freeze({
  id: 'op_provider.providerpar.instance:private',
  entityId: 'providerpar',
  name: 'paris',
});

describe('Integration | Component | file distribution modal/oneproviders distribution', function () {
  setupComponentTest('file-distribution-modal/oneproviders-distribution', {
    integration: true,
  });

  beforeEach(function () {
    const oneproviders = [
      oneproviderKrakow,
      oneproviderParis,
    ];

    this.setProperties({
      oneproviders,
    });
  }),

  it('renders all oneproviders', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-name:contains("krakow")')).to.exist;
    expect(this.$('.oneprovider-name:contains("paris")')).to.exist;
  });

  it('renders percentage and chunks representation', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to.exist;
    expect(this.$('.oneprovider-providerkrk .chunks-canvas')).to.exist;
    expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('50%');
    expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to.exist;
    expect(this.$('.oneprovider-providerkrk .never-synchronized-background')).to.not.exist;
  });

  it('renders never-synchronized info', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized')).to.exist;
    expect(this.$('.oneprovider-providerpar .never-synchronized-background')).to.exist;
    expect(this.$('.oneprovider-providerpar .percentage-text')).to.contain('n/a');
    expect(this.$('.oneprovider-providerpar .chunks-canvas')).to.not.exist;
  });

  it('renders distribution for single file', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to.exist;
    expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('50%');
    expect(this.$('.oneprovider-providerkrk .upper-size')).to.contain('1 KiB');
    expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized')).to.exist;
  });

  it('renders distribution for two files', function () {
    const fileDistributionData = [
      createFileDistributionContainerStub(),
      createFileDistributionContainerStub({ onKrakow: 100 }),
    ];

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to.exist;
    expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('75%');
    expect(this.$('.oneprovider-providerkrk .upper-size')).to.contain('2 KiB');
    expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized')).to.exist;
  });

  it('renders distribution for single file and single dir', function () {
    const fileDistributionData = [
      createFileDistributionContainerStub(),
      createFileDistributionContainerStub({ type: 'dir' }),
    ];

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to.exist;
    expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('50%');
    expect(this.$('.oneprovider-providerkrk .upper-size')).to.contain('1 KiB');
    expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized')).to.exist;
  });

  it('allows to start replication', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];
    const startReplicationStub = sinon.stub();
    let resolveReplication;
    startReplicationStub.returns(new Promise(resolve => {
      resolveReplication = resolve;
    }));

    this.on('replicate', startReplicationStub);
    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData
        onReplicate=(action "replicate")}}
    `);

    return click('.oneprovider-providerpar .btn-menu-toggle')
      .then(() => click($('body .webui-popover .replicate-here-action-trigger')[0]))
      .then(() => {
        expect(startReplicationStub).to.have.calledOnce;
        expect(this.$('.oneprovider-providerpar .replication-status-icon')).to.have.class('inProgress');
        return resolveReplication();
      })
      .then(() => wait())
      .then(() =>
        expect(this.$('.oneprovider-providerpar .replication-status-icon')).to.not.have.class('inProgress')
      );
  });
  
  it('allows to start migration', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];
    const startMigrationStub = sinon.stub();
    let resolveMigration;
    startMigrationStub.returns(new Promise(resolve => {
      resolveMigration = resolve;
    }));

    this.on('migrate', startMigrationStub);
    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData
        onMigrate=(action "migrate")}}
    `);

    return click('.oneprovider-providerkrk .btn-menu-toggle')
      .then(() => click($('body .webui-popover .migrate-action-trigger')[0]))
      .then(() => click('.start-migration'))
      .then(() => {
        expect(startMigrationStub).to.have.calledOnce;
        expect(this.$('.oneprovider-providerkrk .migration-status-icon')).to.have.class('inProgress');
        return resolveMigration();
      })
      .then(() => wait())
      .then(() =>
        expect(this.$('.oneprovider-providerkrk .migration-status-icon')).to.not.have.class('inProgress')
      );
  });

  it('allows to start eviction', function () {
    const fileDistributionData = [
      createFileDistributionContainerStub({ onParis: 100 }),
    ];
    const startEvictionStub = sinon.stub();
    let resolveEviction;
    startEvictionStub.returns(new Promise(resolve => {
      resolveEviction = resolve;
    }));

    this.on('evict', startEvictionStub);
    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData
        onEvict=(action "evict")}}
    `);

    return click('.oneprovider-providerkrk .btn-menu-toggle')
      .then(() => click($('body .webui-popover .evict-action-trigger')[0]))
      .then(() => {
        expect(startEvictionStub).to.have.calledOnce;
        expect(this.$('.oneprovider-providerkrk .eviction-status-icon')).to.have.class('inProgress');
        return resolveEviction();
      })
      .then(() => wait())
      .then(() =>
        expect(this.$('.oneprovider-providerkrk .replication-status-icon')).to.not.have.class('inProgress')
      );
  });

  it('shows that replication is in progress', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];
    set(fileDistributionData[0], 'activeTransfers', [{
      belongsTo(relation) {
        if (relation === 'replicatingProvider') {
          return { id: () => oneproviderParis.id };
        } else {
          return { id: () => null };
        }
      },
    }]);

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerpar .replication-status-icon')).to.have.class('inProgress');
    expect(this.$('.oneprovider-providerpar .migration-status-icon')).to.not.have.class('inProgress');
    expect(this.$('.oneprovider-providerpar .eviction-status-icon')).to.not.have.class('inProgress');
  });

  it('shows that migration is in progress', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];
    set(fileDistributionData[0], 'activeTransfers', [{
      belongsTo(relation) {
        if (relation === 'replicatingProvider') {
          return { id: () => oneproviderParis.id };
        } else if (relation === 'evictingProvider') {
          return { id: () => oneproviderKrakow.id };
        }
      },
    }]);

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerpar .replication-status-icon')).to.have.class('inProgress');
    expect(this.$('.oneprovider-providerpar .migration-status-icon')).to.not.have.class('inProgress');
    expect(this.$('.oneprovider-providerpar .eviction-status-icon')).to.not.have.class('inProgress');
    expect(this.$('.oneprovider-providerkrk .migration-status-icon')).to.have.class('inProgress');
  });

  it('shows that eviction is in progress', function () {
    const fileDistributionData = [createFileDistributionContainerStub()];
    set(fileDistributionData[0], 'activeTransfers', [{
      belongsTo(relation) {
        if (relation === 'evictingProvider') {
          return { id: () => oneproviderKrakow.id };
        } else {
          return { id: () => null };
        }
      },
    }]);

    this.set('fileDistributionData', fileDistributionData);
    this.render(hbs`
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData}}
    `);

    expect(this.$('.oneprovider-providerkrk .replication-status-icon')).to.not.have.class('inProgress');
    expect(this.$('.oneprovider-providerkrk .migration-status-icon')).to.not.have.class('inProgress');
    expect(this.$('.oneprovider-providerkrk .eviction-status-icon')).to.have.class('inProgress');
  });
});
