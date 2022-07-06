import { expect } from 'chai';
import { describe, it, beforeEach, context } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, click, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject, { set } from '@ember/object';
import sinon from 'sinon';
import { Promise } from 'rsvp';
import FileDistributionDataContainer from 'oneprovider-gui/utils/file-distribution-data-container';
import { findByText } from '../../../helpers/find';
import { lookupService } from '../../helpers/stub-service';

/**
 * @param {Object} distributionParams
 *   { type: file|dir, onKrakow: percentage, onParis: percentage}
 * @returns {EmberObject}
 */
function createFileDistributionContainerStub({ type, onKrakow, onParis, success } = {}) {
  const normalizedOnKrakow = onKrakow || 50;
  const normalizedOnKrakowDir = onKrakow / 100 * 1024 || 512;
  const normalizedOnParis = onParis || 0;
  const successOnKrakow = success ? success.onKrakow : true;
  const successOnParis = success ? success.onParis : true;

  return EmberObject.create({
    fileType: type || 'file',
    fileSize: 1024,
    isFileDistributionLoaded: true,
    fileDistribution: {
      providerkrk: {
        success: successOnKrakow,
        distributionPerStorage: {
          storage1: type === 'dir' ? normalizedOnKrakowDir : {
            blocksPercentage: normalizedOnKrakow,
            chunksBarData: {
              0: normalizedOnKrakow,
            },
            physicalSize: 1024 * normalizedOnKrakow / 100,
          },
        },
      },
      providerpar: {
        success: successOnParis,
        distributionPerStorage: {
          storage2: type === 'dir' ? normalizedOnParis : {
            blocksPercentage: normalizedOnParis,
            chunksBarData: {
              0: normalizedOnParis,
            },
            physicalSize: 1024 * normalizedOnParis / 100,
          },
        },
      },
    },
    getDistributionForOneprovider(oneprovider) {
      return this.get(`fileDistribution.${oneprovider.entityId}`);
    },
    getStoragesForOneprovider(oneprovider) {
      if (this.get(`fileDistribution.${oneprovider.entityId}.distributionPerStorage`)) {
        return Object.keys(this.get(`fileDistribution.${oneprovider.entityId}.distributionPerStorage`));
      } else {
        return {};
      }
    },
    getDistributionForStorage(oneprovider, storage) {
      if (this.get(`fileDistribution.${oneprovider.entityId}.distributionPerStorage`)) {
        return this.get(`fileDistribution.${oneprovider.entityId}.distributionPerStorage.${storage}`);
      } else {
        return {};
      }
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
    setupRenderingTest();

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

      sinon.stub(lookupService(this, 'storageManager'), 'getStorageById')
        .returns('storage');

      this.setProperties({
        oneproviders,
        space,
      });
    });

    it('renders all oneproviders', async function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(findByText('krakow', '.oneprovider-name')).to.exist;
      expect(findByText('paris', '.oneprovider-name')).to.exist;
    });

    it('renders percentage and chunks representation', async function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .chunks-canvas')).to.exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('50%');
      expect(find('.oneprovider-providerkrk .never-synchronized-background'))
        .to.not.exist;
    });

    it('renders percentage and progress bar representation', async function () {
      const fileDistributionData = [createFileDistributionContainerStub({ type: 'dir' })];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .progress-bar-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .progress-bar')).to.exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('50%');
      expect(find('.oneprovider-providerkrk .never-synchronized-background'))
        .to.not.exist;
    });

    it('renders n/a info', async function () {
      const fileDistributionData = [createFileDistributionContainerStub({
        success: { onKrakow: false, onParis: false },
        type: 'dir',
      })];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .progress-bar-visualizer')).to
        .exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('n/a');
      expect(find('.oneprovider-providerkrk .progress-bar-text')).to.contain.text('n/a');
    });

    it('renders distribution for single file', async function () {
      const fileDistributionData = [createFileDistributionContainerStub()];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .chunks-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('50%');
      expect(find('.oneprovider-providerkrk .chunks-text')).to.contain.text('512 B');

      expect(find('.oneprovider-providerpar .chunks-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerpar .percentage-text')).to.contain.text('0%');
      expect(find('.oneprovider-providerpar .chunks-text')).to.contain.text('0 B');
    });

    it('renders distribution for two files', async function () {
      const fileDistributionData = [
        createFileDistributionContainerStub(),
        createFileDistributionContainerStub({ onKrakow: 100 }),
      ];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .progress-bar-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('75%');
      expect(find('.oneprovider-providerkrk .size-label')).to.contain.text('1.5 KiB');
      expect(find('.oneprovider-providerpar .percentage-text')).to.contain.text('0%');
      expect(find('.oneprovider-providerpar .size-label')).to.contain.text('0 B');
    });

    it('renders distribution for single dir with one provider dir stats off', async function () {
      const fileDistributionData = [createFileDistributionContainerStub({
        success: { onKrakow: true, onParis: false },
        type: 'dir',
      })];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .progress-bar-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('50%');
      expect(find('.oneprovider-providerkrk .size-label')).to.contain.text('512 B');

      expect(find('.oneprovider-providerpar .progress-bar-visualizer')).to
        .exist;
      expect(find('.oneprovider-providerpar .percentage-text')).to.contain.text('n/a');
      expect(find('.oneprovider-providerpar .progress-bar-text')).to.contain.text('n/a');
    });

    it('renders distribution for two dir with one provider dir stats off', async function () {
      const fileDistributionData = [
        createFileDistributionContainerStub({
          success: { onKrakow: true, onParis: false },
          type: 'dir',
        }),
        createFileDistributionContainerStub({
          success: { onKrakow: true, onParis: false },
          type: 'dir',
        }),
      ];

      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .progress-bar-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('50%');
      expect(find('.oneprovider-providerkrk .size-label')).to.contain.text('1 KiB');

      expect(find('.oneprovider-providerpar .progress-bar-visualizer')).to
        .exist;
      expect(find('.oneprovider-providerpar .percentage-text')).to.contain.text('n/a');
      expect(find('.oneprovider-providerpar .progress-bar-text')).to.contain.text('n/a');
    });

    it('renders distribution for single file and single dir with one provider dir stats off', async function () {
      const fileDistributionData = [
        createFileDistributionContainerStub(),
        createFileDistributionContainerStub({
          success: { onKrakow: true, onParis: false },
          type: 'dir',
        }),
      ];
      this.set('fileDistributionData', fileDistributionData);
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .progress-bar-visualizer.synchronized')).to
        .exist;
      expect(find('.oneprovider-providerkrk .percentage-text')).to.contain.text('50%');
      expect(find('.oneprovider-providerkrk .size-label')).to.contain.text('1 KiB');

      expect(find('.oneprovider-providerpar .progress-bar-visualizer')).to
        .exist;
      expect(find('.oneprovider-providerpar .percentage-text')).to.contain.text('n/a');
      expect(find('.oneprovider-providerpar .progress-bar-text')).to.contain.text('n/a');
    });

    it('shows that replication is in progress', async function () {
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
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerpar .replication-status-icon'))
        .to.have.class('in-progress');
      expect(find('.oneprovider-providerpar .migration-status-icon'))
        .to.not.have.class('in-progress');
      expect(find('.oneprovider-providerpar .eviction-status-icon'))
        .to.not.have.class('in-progress');
    });

    it('shows that migration is in progress', async function () {
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
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerpar .replication-status-icon'))
        .to.have.class('in-progress');
      expect(find('.oneprovider-providerpar .migration-status-icon'))
        .to.not.have.class('in-progress');
      expect(find('.oneprovider-providerpar .eviction-status-icon'))
        .to.not.have.class('in-progress');
      expect(find('.oneprovider-providerkrk .migration-status-icon'))
        .to.have.class('in-progress');
    });

    it('shows that eviction is in progress', async function () {
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
      await render(hbs `
        {{file-distribution-modal/oneproviders-distribution
          oneproviders=oneproviders
          fileDistributionData=fileDistributionData
          space=space
        }}
      `);

      expect(find('.oneprovider-providerkrk .replication-status-icon'))
        .to.not.have.class('in-progress');
      expect(find('.oneprovider-providerkrk .migration-status-icon'))
        .to.not.have.class('in-progress');
      expect(find('.oneprovider-providerkrk .eviction-status-icon'))
        .to.have.class('in-progress');
    });

    ['ongoing', 'ended'].forEach((transferStatus) => {
      it('renders link to transfers using external function if have active transfers',
        async function () {
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
          const fetchFileDistributionModel = sinon.stub().resolves();
          const fileDistributionData = [FileDistributionDataContainer.create({
            transferManager: null,
            onedataConnection: null,
            fetchTransfers,
            file,
            fetchFileDistributionModel,
            fileDistribution: createFileDistributionContainerStub().fileDistribution,
            getDistributionForOneprovider(oneprovider) {
              return this.get(`fileDistribution.${oneprovider.entityId}`);
            },
            getStoragesForOneprovider(oneprovider) {
              if (this.get(`fileDistribution.${oneprovider.entityId}.distributionPerStorage`)) {
                return Object.keys(this.get(
                  `fileDistribution.${oneprovider.entityId}.distributionPerStorage`));
              } else {
                return {};
              }
            },
            getDistributionForStorage(oneprovider, storage) {
              return this.get(
                `fileDistribution.${oneprovider.entityId}.distributionPerStorage.${storage}`);
            },
          })];
          const generatedHref = 'generatedHref';
          const getTransfersUrl = sinon.stub();
          const expectedArgs = sinon.match({
            fileId,
          });
          getTransfersUrl.returns('invalidGeneratedHref');
          getTransfersUrl.withArgs(expectedArgs).returns(generatedHref);
          this.set('getTransfersUrl', getTransfersUrl);

          this.set('fileDistributionData', fileDistributionData);
          await render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              getTransfersUrl=(action getTransfersUrl)
            }}
          `);

          expect(find('.link-to-transfers'), 'link').to.exist;
          expect(getTransfersUrl).to.have.been.calledWith(expectedArgs);
          expect(find('.link-to-transfers'))
            .to.have.attr('href', generatedHref);
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

        this.set('startAction', startActionStub);
        this.set('startActionStub', startActionStub);
        this.set('resolveStartAction', resolveStartAction);
        this.set('fileDistributionData', fileDistributionData);
      });

      it('allows to start replication', async function () {
        const {
          startActionStub,
          resolveStartAction,
        } = this.getProperties('startActionStub', 'resolveStartAction');

        await render(hbs `
          {{file-distribution-modal/oneproviders-distribution
            oneproviders=oneproviders
            fileDistributionData=fileDistributionData
            space=space
            onReplicate=(action startAction)
          }}
        `);

        return click('.oneprovider-providerpar .one-pill-button-actions-trigger')
          .then(() => click(
            document.querySelector('.webui-popover .replicate-here-action-trigger')
          ))
          .then(() => {
            expect(startActionStub).to.have.been.calledOnce;
            expect(find('.oneprovider-providerpar .replication-status-icon'))
              .to.have.class('in-progress');
            resolveStartAction();
            return settled();
          })
          .then(() =>
            expect(find('.oneprovider-providerpar .replication-status-icon'))
            .to.not.have.class('in-progress')
          );
      });

      it('allows to start migration', async function () {
        const {
          startActionStub,
          resolveStartAction,
        } = this.getProperties('startActionStub', 'resolveStartAction');

        await render(hbs `
          {{file-distribution-modal/oneproviders-distribution
            oneproviders=oneproviders
            fileDistributionData=fileDistributionData
            space=space
            onMigrate=(action startAction)
          }}
        `);

        return click('.oneprovider-providerkrk .one-pill-button-actions-trigger')
          .then(() => click(
            document.querySelector('.webui-popover .migrate-action-trigger')
          ))
          .then(() => click('.start-migration'))
          .then(() => {
            expect(startActionStub).to.have.been.calledOnce;
            expect(find('.oneprovider-providerkrk .migration-status-icon'))
              .to.have.class('in-progress');
            resolveStartAction();
            return settled();
          })
          .then(() =>
            expect(find('.oneprovider-providerkrk .migration-status-icon'))
            .to.not.have.class('in-progress')
          );
      });

      it('allows to start eviction', async function () {
        const {
          startActionStub,
          resolveStartAction,
        } = this.getProperties('startActionStub', 'resolveStartAction');
        this.set('fileDistributionData', [
          createFileDistributionContainerStub({ onParis: 100 }),
        ]);

        await render(hbs `
          {{file-distribution-modal/oneproviders-distribution
            oneproviders=oneproviders
            fileDistributionData=fileDistributionData
            space=space
            onEvict=(action startAction)
          }}
        `);

        return click('.oneprovider-providerkrk .one-pill-button-actions-trigger')
          .then(() => click(
            document.querySelector('.webui-popover .evict-action-trigger')
          ))
          .then(() => {
            expect(startActionStub).to.have.been.calledOnce;
            expect(find('.oneprovider-providerkrk .eviction-status-icon'))
              .to.have.class('in-progress');
            resolveStartAction();
            return settled();
          })
          .then(() =>
            expect(find('.oneprovider-providerkrk .eviction-status-icon'))
            .to.not.have.class('in-progress')
          );
      });

      it('does not allow to start replication without scheduleReplication privilege',
        async function () {
          const startActionStub = this.get('startActionStub');
          this.set('space.privileges.scheduleReplication', false);

          await render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              onReplicate=(action startAction)
            }}
          `);

          return click('.oneprovider-providerpar .one-pill-button-actions-trigger')
            .then(() => click(
              document.querySelector('.webui-popover .replicate-here-action-trigger')
            ))
            .then(() => {
              expect(startActionStub).to.have.not.been.called;
            });
        }
      );

      it('does not allow to start eviction without scheduleEviction privilege',
        async function () {
          const startActionStub = this.get('startActionStub');
          this.set('space.privileges.scheduleEviction', false);

          this.set('fileDistributionData', [
            createFileDistributionContainerStub({ onParis: 100 }),
          ]);

          await render(hbs `
            {{file-distribution-modal/oneproviders-distribution
              oneproviders=oneproviders
              fileDistributionData=fileDistributionData
              space=space
              onEvict=(action startAction)
            }}
          `);

          return click('.oneprovider-providerpar .one-pill-button-actions-trigger')
            .then(() => click(
              document.querySelector('.webui-popover .evict-action-trigger')
            ))
            .then(() => {
              expect(startActionStub).to.have.not.been.called;
            });
        }
      );

      ['scheduleEviction', 'scheduleReplication'].forEach(flag => {
        it(`does not allow to start migration without ${flag} privilege`,
          async function () {
            this.set(`space.privileges.${flag}`, false);

            this.set('fileDistributionData', [
              createFileDistributionContainerStub({ onParis: 100 }),
            ]);

            await render(hbs `
              {{file-distribution-modal/oneproviders-distribution
                oneproviders=oneproviders
                fileDistributionData=fileDistributionData
                space=space
                onMigrate=(action startAction)
              }}
            `);

            return click('.oneprovider-providerpar .one-pill-button-actions-trigger')
              .then(() => {
                const trigger =
                  document.querySelector('.webui-popover .migrate-action-trigger');
                expect(trigger.parentElement).to.have.class('disabled');
                return click(trigger);
              })
              .then(() => expect(
                document.querySelector('.destination-oneprovider-selector')
              ).to.not.exist);
          }
        );
      });
    });
  }
);
