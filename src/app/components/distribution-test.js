import Component from '@ember/component';
import { computed } from '@ember/object';
import { resolve } from 'rsvp';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';

export default Component.extend({
  space: computed(function () {
    return {
      oneproviderList: resolve({
        list: resolve([
          {
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
      }),
    };
  }),

  files: computed(function () {
    return [
      {
        name: 'adsf',
        size: 1024,
        type: 'file',
        fileDistribution: PromiseObject.create({ promise: resolve({
          distribution: {
            123: {
              blocksPercentage: 50,
              chunksBarData: {
                0: 50,
                120: 0,
                220: 100,
              },
              neverSynchronized: false,
            },
            456: {
              blocksPercentage: 0,
              chunksBarData: {
                0: 0,
              },
              neverSynchronized: true,
            },
            789: {
              blocksPercentage: 0,
              chunksBarData: {
                0: 0,
              },
              neverSynchronized: true,
            },
          },
        })}),
      },
      {
        name: 'zxcv',
        size: 2048,
        type: 'file',
        fileDistribution: PromiseObject.create({ promise: resolve({
          distribution: {
            123: {
              blocksPercentage: 100,
              chunksBarData: {
                0: 100,
              },
              neverSynchronized: false,
            },
            456: {
              blocksPercentage: 0,
              chunksBarData: {
                0: 0,
              },
              neverSynchronized: true,
            },
            789: {
              blocksPercentage: 0,
              chunksBarData: {
                0: 0,
              },
              neverSynchronized: false,
            },
          },
        })}),
      },
    ];
  }),
});
