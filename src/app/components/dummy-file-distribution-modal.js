/**
 * Standalone component to test file distribution modal.
 * 
 * @module components/dummy-file-distribution-modal
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { resolve } from 'rsvp';

export default Component.extend({
  space: computed(function space() {
    const providerList = resolve({
      list: resolve([{
          id: 'provider.123.instance:private',
          entityId: '123',
          name: 'dev-oneprovider-krakow',
        },
        {
          id: 'provider.456.instance:private',
          entityId: '456',
          name: 'dev-oneprovider-paris',
        },
        {
          id: 'provider.789.instance:private',
          entityId: '789',
          name: 'dev-oneprovider-lisbon',
        },
      ]),
    });
    return {
      providerList,
      providersWithReadonlySupport: ['789'],
      privileges: {
        scheduleReplication: true,
        scheduleEviction: true,
      },
      getRelation(relation) {
        switch (relation) {
          case 'providerList':
            return providerList;
        }
      },
    };
  }),

  files: computed(function files() {
    return [{
        entityId: 'file1',
        name: 'adsf',
        size: 1024,
        type: 'file',
        belongsTo(relation) {
          if (relation === 'distribution') {
            return {
              reload: () => resolve({
                distributionPerProvider: {
                  123: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage1: {
                        physicalSize: 512,
                        blocksPercentage: 50,
                        chunksBarData: {
                          0: 50,
                          120: 0,
                          220: 100,
                        },
                        blockCount: 2,
                      },
                    },
                  },
                  456: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage2: {
                        physicalSize: 512,
                        blocksPercentage: 50,
                        chunksBarData: {
                          0: 50,
                          120: 0,
                          220: 100,
                        },
                        blockCount: 2,
                      },
                    },
                  },
                  789: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage3: {
                        physicalSize: 0,
                        blocksPercentage: 0,
                        chunksBarData: {
                          0: 0,
                        },
                        blockCount: 0,
                      },
                    },
                  },
                },
              }),
            };
          }
        },
      },
      {
        entityId: 'file2',
        name: 'zxcv',
        size: 2048,
        type: 'file',
        belongsTo(relation) {
          if (relation === 'distribution') {
            return {
              reload: () => resolve({
                distributionPerProvider: {
                  123: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage1: {
                        physicalSize: 1024,
                        blocksPercentage: 100,
                        chunksBarData: {
                          0: 100,
                        },
                        blockCount: 1,
                      },
                    },
                  },
                  456: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage2: {
                        physicalSize: 0,
                        blocksPercentage: 0,
                        chunksBarData: {
                          0: 0,
                        },
                        blockCount: 0,
                      },
                    },
                  },
                  789: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage3: {
                        physicalSize: 0,
                        blocksPercentage: 0,
                        chunksBarData: {
                          0: 0,
                        },
                        blockCount: 0,
                      },
                    },
                  },
                },
              }),
            };
          }
        },
      },
      {
        entityId: 'dir1',
        name: 'dir_name1',
        size: 1024,
        type: 'dir',
        belongsTo(relation) {
          if (relation === 'distribution') {
            return {
              reload: () => resolve({
                distributionPerProvider: {
                  123: {
                    success: true,
                    logicalSize: 1024,
                    distributionPerStorage: {
                      storage1: {
                        physicalSize: 1024,
                      },
                    },
                  },
                  456: {
                    success: true,
                    logicalSize: 0,
                    distributionPerStorage: {
                      storage2: {
                        physicalSize: 0,
                      },
                    },
                  },
                  789: {
                    success: false,
                    distributionPerStorage: {
                      storage3: {
                        error: {
                          description: 'Directory statistics collection is disabled for this space.',
                          id: 'dirStatsDisabledForSpace',
                        },
                      },
                    },

                  },
                },
              }),
            };
          }
        },
      },
    ];
  }),
});
