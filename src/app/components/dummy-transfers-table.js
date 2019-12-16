import Component from '@ember/component';
import EmberObject, { computed } from '@ember/object';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { Promise, resolve } from 'rsvp';
import Evented from '@ember/object/evented';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

const FakeTransfer = EmberObject.extend(Evented, {
  dummyTransfersTable: undefined,
  entityId: undefined,
  entityType: 'op_transfer',
  isLoaded: true,

  id: computed(function id() {
    return `transfer.${this.get('entityId')}.instance:private`;
  }),

  init() {
    this._super(...arguments);
    this.set('scheduleTime', Math.floor(Date.now() / 1000));
    this.set('startTime', Math.floor(Date.now() / 1000));
    this.set('finishTime', Math.floor(Date.now() / 1000));
  },

  fetchUser() {
    return resolve(this.get('dummyTransfersTable').fetch());
  },

  reload() {
    return resolve(this);
  },

  updateTransferProgressProxy() {
    return this.get('transferProgressProxy.promise');
  },
});

export default Component.extend({
  spaceId: 's1',
  updaterId: 'u1',

  transfersArray: computed(function transfersArray() {
    return ReplacingChunksArray.create({
      fetch: this.fetch.bind(this),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
    });
  }),

  providers: computed(() => {
    return [{
      id: 'xd.p1.instance:private',
      entityId: 'p1',
      name: 'Pro1',
      online: true,
    }];
  }),

  providersColors: computed(() => ({
    'p1': '#ccdd00',
    'oneprovider-1': '#aabb00',
  })),

  user1: computed(() => ({
    fullName: 'John Doe',
    username: 'john',
  })),

  space1: computed(() => ({
    entityId: 'sp1',
    name: 'Space One',
  })),

  progress1: computed(() => ({
    status: 'failed',
    timestamp: () => Math.floor(Date.now() / 1000),
    replicatedBytes: 100000,
    replicatedFiles: 12,
    evictedFiles: 10,
  })),

  index1: computed(function index1() {
    return {
      entityId: 'vi1',
      name: 'Some db view',
      providers: ['p1'],
      space: resolve(this.get('space1')),
      spatial: true,
      viewOptions: {
        hello: 'world',
      },
      mapFunction: `
function someMap() {
  console.log('hello world');
  return 0;
}
      `,
      reduceFunction: `
function someReduce() {
  console.log('foo bar');
  return 1;
}
      `,
    };
  }),

  transfer1: computed('index1', 'progress1', function transfer1() {
    return FakeTransfer.create({
      dummyTransfersTable: this,
      dataSourceName: 'Some db index',
      dataSourceType: 'view',
      dataSourceId: 'vi1',
      entityId: 't1',
      isEnded: true,
      dataSource: promiseObject(resolve(this.get('index1'))),
      type: 'eviction',
      transferProgressProxy: promiseObject(resolve(this.get('progress1'))),
      queryParams: {
        hello: 'world',
        foo: 'bar',
      },
    });
  }),

  expandedTransferIds: computed(() => ['t1']),

  fetch() {
    return resolve([this.get('transfer1')]);
  },

  actions: {
    clearJustChangedTabId: notImplementedIgnore,
    rerunTransfer: notImplementedReject,
    cancelTransfer() {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 4000);
      });
    },
  },
});
