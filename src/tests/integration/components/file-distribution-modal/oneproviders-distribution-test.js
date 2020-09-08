import { expect } from 'chai';
import { describe, it, beforeEach, context } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import EmberObject, { set } from '@ember/object';
import sinon from 'sinon';
import $ from 'jquery';
import { click } from 'ember-native-dom-helpers';
import { Promise } from 'rsvp';
import wait from 'ember-test-helpers/wait';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';

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

describe('Integration | Component | file distribution modal/oneproviders distribution',
  function () {
    setupComponentTest('file-distribution-modal/oneproviders-distribution', {
      integration: true,
    });

    beforeEach(function () {
      const oneproviders = [
        oneproviderKrakow,
        oneproviderParis,
      ];

      const space = {
        providersWithReadonlySupport: [],
        privileges: {
          scheduleReplication: true,
          scheduleEviction: true,
        },
      };

      this.setProperties({
        oneproviders,
        space,
      });
    });

    it('renders all oneproviders', function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-name:contains("krakow")')).to.exist;
      expect(this.$('.oneprovider-name:contains("paris")')).to.exist;
    });

    it('renders percentage and chunks representation', function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      this.render(hbs `
      {{file-distribution-modal/oneproviders-distribution
        oneproviders=oneproviders
        fileDistributionData=fileDistributionData
        space=space
      }}
    `);

      expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(this.$('.oneprovider-providerkrk .chunks-canvas')).to.exist;
      expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('50%');
      expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(this.$('.oneprovider-providerkrk .never-synchronized-background'))
        .to.not.exist;
    });

    it('renders never-synchronized info', function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized'))
        .to.exist;
      expect(this.$('.oneprovider-providerpar .never-synchronized-background')).to
        .exist;
      expect(this.$('.oneprovider-providerpar .percentage-text')).to.contain('n/a');
      expect(this.$('.oneprovider-providerpar .chunks-canvas')).to.not.exist;
    });

    it('renders distribution for single file', function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('50%');
      expect(this.$('.oneprovider-providerkrk .upper-size')).to.contain('1 KiB');
      expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized'))
        .to.exist;
    });

    it('renders distribution for two files', function () {
      const fileDistributionData = [
        createFileDistributionContainerStub(),
        createFileDistributionContainerStub({ onKrakow: 100 }),
      ];

      this.set('fileDistributionData', fileDistributionData);
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('75%');
      expect(this.$('.oneprovider-providerkrk .upper-size')).to.contain('2 KiB');
      expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized'))
        .to.exist;
    });

    it('renders distribution for single file and single dir', function () {
      const fileDistributionData = [
        createFileDistributionContainerStub(),
        createFileDistributionContainerStub({ type: 'dir' }),
      ];

      this.set('fileDistributionData', fileDistributionData);
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(this.$('.oneprovider-providerkrk .percentage-text')).to.contain('50%');
      expect(this.$('.oneprovider-providerkrk .upper-size')).to.contain('1 KiB');
      expect(this.$('.oneprovider-providerpar .chunks-visualizer.never-synchronized'))
        .to.exist;
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
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerpar .replication-status-icon'))
        .to.have.class('inProgress');
      expect(this.$('.oneprovider-providerpar .migration-status-icon'))
        .to.not.have.class('inProgress');
      expect(this.$('.oneprovider-providerpar .eviction-status-icon'))
        .to.not.have.class('inProgress');
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
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerpar .replication-status-icon'))
        .to.have.class('inProgress');
      expect(this.$('.oneprovider-providerpar .migration-status-icon'))
        .to.not.have.class('inProgress');
      expect(this.$('.oneprovider-providerpar .eviction-status-icon'))
        .to.not.have.class('inProgress');
      expect(this.$('.oneprovider-providerkrk .migration-status-icon'))
        .to.have.class('inProgress');
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
      this.render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(this.$('.oneprovider-providerkrk .replication-status-icon'))
        .to.not.have.class('inProgress');
      expect(this.$('.oneprovider-providerkrk .migration-status-icon'))
        .to.not.have.class('inProgress');
      expect(this.$('.oneprovider-providerkrk .eviction-status-icon'))
        .to.have.class('inProgress');
    });

    ['ongoing', 'ended'].forEach((transferStatus) => {
      it('renders link to transfers using external function if have active transfers',
        function () {
          const transfersActive = transferStatus === 'ongoing';
          const fileId = 'someFileId';
          const file = EmberObject.create({
            entityId: fileId,
          });
          const transfer = {
            belongsTo(relation) {
              if (relation === 'replicatingProvider') {
                return { id: () => oneproviderKrakow.id };
              } else {
                return { id: () => null };
              }
            },
          };
          let transfers;
          if (transfersActive) {
            transfers = {
              ongoingTransfers: [transfer],
              endedCount: 1,
            };
          } else {
            transfers = {
              ongoingTransfers: [],
              endedCount: 1,
            };
          }
          const fetchTransfers = sinon.stub().resolves(transfers);
          const fileDistributionData = [FileDistributionDataContainer.create({
            transferManager: null,
            onedataConnection: null,
            fetchTransfers,
            file,
          })];
          const generatedHref = 'generatedHref';
          const getTransfersUrl = sinon.stub();
          const expectedArgs = sinon.match({
            fileId,
          });
          getTransfersUrl.returns('invalidGeneratedHref');
          getTransfersUrl.withArgs(expectedArgs).returns(generatedHref);
          this.on('getTransfersUrl', getTransfersUrl);

          this.set('fileDistributionData', fileDistributionData);
          this.render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              getTransfersUrl=(action "getTransfersUrl")
            }}
          `);

          return wait().then(() => {
            expect(this.$('.link-to-transfers'), 'link').to.exist;
            expect(getTransfersUrl).to.have.been.calledWith(expectedArgs);
            expect(this.$('.link-to-transfers').attr('href'), 'href')
              .to.equal(generatedHref);
          });
        }
      );
    });

    context('start transfer action', function () {
      beforeEach(function () {
        const fileDistributionData = [createFileDistributionContainerStub()];
        const startActionStub = sinon.stub().resolves();

        let resolveStartAction;
        startActionStub.returns(new Promise(resolve => {
          resolveStartAction = resolve;
        }));

        this.on('startAction', startActionStub);
        this.set('startActionStub', startActionStub);
        this.set('resolveStartAction', resolveStartAction);
        this.set('fileDistributionData', fileDistributionData);
      });

      it('allows to start replication', function () {
        const {
          startActionStub,
          resolveStartAction,
        } = this.getProperties('startActionStub', 'resolveStartAction');

        this.render(hbs `
          {{file-distribution-modal/oneproviders-distribution
            oneproviders=oneproviders
            fileDistributionData=fileDistributionData
            space=space
            onReplicate=(action "startAction")
          }}
        `);

        return click('.oneprovider-providerpar .btn-menu-toggle')
          .then(() => click($('body .webui-popover .replicate-here-action-trigger')[0]))
          .then(() => {
            expect(startActionStub).to.have.been.calledOnce;
            expect(this.$('.oneprovider-providerpar .replication-status-icon'))
              .to.have.class('inProgress');
            return resolveStartAction();
          })
          .then(() => wait())
          .then(() =>
            expect(this.$('.oneprovider-providerpar .replication-status-icon'))
            .to.not.have.class('inProgress')
          );
      });

      it('allows to start migration', function () {
        const {
          startActionStub,
          resolveStartAction,
        } = this.getProperties('startActionStub', 'resolveStartAction');

        this.render(hbs `
          {{file-distribution-modal/oneproviders-distribution
            oneproviders=oneproviders
            fileDistributionData=fileDistributionData
            space=space
            onMigrate=(action "startAction")
          }}
        `);

        return click('.oneprovider-providerkrk .btn-menu-toggle')
          .then(() => click($('body .webui-popover .migrate-action-trigger')[0]))
          .then(() => click('.start-migration'))
          .then(() => {
            expect(startActionStub).to.have.been.calledOnce;
            expect(this.$('.oneprovider-providerkrk .migration-status-icon'))
              .to.have.class('inProgress');
            return resolveStartAction();
          })
          .then(() => wait())
          .then(() =>
            expect(this.$('.oneprovider-providerkrk .migration-status-icon'))
            .to.not.have.class('inProgress')
          );
      });

      it('allows to start eviction', function () {
        const {
          startActionStub,
          resolveStartAction,
        } = this.getProperties('startActionStub', 'resolveStartAction');
        this.set('fileDistributionData', [
          createFileDistributionContainerStub({ onParis: 100 }),
        ]);

        this.render(hbs `
          {{file-distribution-modal/oneproviders-distribution
            oneproviders=oneproviders
            fileDistributionData=fileDistributionData
            space=space
            onEvict=(action "startAction")
          }}
        `);

        return click('.oneprovider-providerkrk .btn-menu-toggle')
          .then(() => click($('body .webui-popover .evict-action-trigger')[0]))
          .then(() => {
            expect(startActionStub).to.have.been.calledOnce;
            expect(this.$('.oneprovider-providerkrk .eviction-status-icon'))
              .to.have.class('inProgress');
            return resolveStartAction();
          })
          .then(() => wait())
          .then(() =>
            expect(this.$('.oneprovider-providerkrk .eviction-status-icon'))
            .to.not.have.class('inProgress')
          );
      });

      it('does not allow to start replication without scheduleReplication privilege',
        function () {
          const startActionStub = this.get('startActionStub');
          this.set('space.privileges.scheduleReplication', false);

          this.render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              onReplicate=(action "startAction")
            }}
          `);

          return click('.oneprovider-providerpar .btn-menu-toggle')
            .then(() => click($('body .webui-popover .replicate-here-action-trigger')[0]))
            .then(() => {
              expect(startActionStub).to.have.not.been.called;
            });
        }
      );

      it('does not allow to start eviction without scheduleEviction privilege',
        function () {
          const startActionStub = this.get('startActionStub');
          this.set('space.privileges.scheduleEviction', false);

          this.set('fileDistributionData', [
            createFileDistributionContainerStub({ onParis: 100 }),
          ]);

          this.render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              onEvict=(action "startAction")
            }}
          `);

          return click('.oneprovider-providerpar .btn-menu-toggle')
            .then(() => click($('body .webui-popover .evict-action-trigger')[0]))
            .then(() => {
              expect(startActionStub).to.have.not.been.called;
            });
        }
      );

      ['scheduleEviction', 'scheduleReplication'].forEach(flag => {
        it(`does not allow to start migration without ${flag} privilege`,
          function () {
            this.set(`space.privileges.${flag}`, false);

            this.set('fileDistributionData', [
              createFileDistributionContainerStub({ onParis: 100 }),
            ]);

            this.render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              onMigrate=(action "startAction")
            }}
          `);

            return click('.oneprovider-providerpar .btn-menu-toggle')
              .then(() => {
                const $trigger = $('body .webui-popover .migrate-action-trigger');
                const $menuItem = $trigger.closest('.one-collapsible-toolbar-item');
                expect($menuItem).to.have.class('disabled');
                return click($trigger[0]);
              })
              .then(() => expect($('.destination-oneprovider-selector')).to.not.exist);
          }
        );
      });
    });
  }
);
