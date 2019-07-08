import Service from '@ember/service';
import { computed, get } from '@ember/object';
import _ from 'lodash';
import { resolve } from 'rsvp';

const lipsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vestibulum dapibus urna eget sollicitudin. Pellentesque at rutrum ligula. Cras id commodo nunc. In faucibus, mauris vitae dapibus mollis, ipsum erat faucibus justo, eget tincidunt nulla neque in tellus. Donec et consequat leo. Aenean viverra ante ut nisi ultricies vehicula. Sed ultrices eu leo ultrices volutpat. Aliquam et odio et ligula varius finibus. Nunc iaculis posuere dui et rutrum. Quisque sit amet tincidunt elit, ut fermentum nulla. ';

export default Service.extend({
  fetchDirChildren(dirId, startFromIndex, size, offset) {
    return resolve(this.mockGetDirChildren(dirId, startFromIndex, size, offset));
  },

  mockGetDirChildren(dirId, index, limit = 100000000, offset = 0) {
    const mockChildren = this.get('mockChildren');
    let arrIndex = _.findIndex(mockChildren, i => get(i, 'index') === index);
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockChildren.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  mockChildren: computed(function mockChildren() {
    const now = Date.now() / 1000;
    return [
      ..._.range(1, 10).map(i => ({
        index: ('0000' + i).substr(-4, 4),
        id: `file.dir-${i}.instance:protected`,
        entityId: `dir-${i}`,
        type: 'dir',
        name: `Directory ${('0000' + i).substr(-4, 4)}`,
        size: 3500000 + 10000 * i,
        modificationTime: now + 1000 * i,
        provider: null,
        totalChildrenCount: 0,
        canViewDir: true,
        permissions: 0o644,
        // FIXME: resolve prev object
        parent: null,
      })),
      {
        index: '0010',
        id: 'file.file-10.instance:protected',
        entityId: 'file-10',
        type: 'file',
        name: lipsum,
        size: 10000,
        modificationTime: now,
        permissions: 0o644,
      },
      ..._.range(11, 1000).map(i => ({
        index: ('0000' + i).substr(-4, 4),
        id: `file.file-${i}.instance:protected`,
        entityId: `file-${i}`,
        type: 'file',
        name: `File ${('0000' + i).substr(-4, 4)}`,
        size: 250000 + 10000 * i,
        modificationTime: now + 1000 * i,
        provider: null,
        permissions: 0o644,
        parent: null,
      })),
    ];
  }),
});
