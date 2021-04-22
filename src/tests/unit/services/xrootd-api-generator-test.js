import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { registerService } from '../../helpers/stub-service';
import Service from '@ember/service';
import generateXrootdApiTemplates from 'oneprovider-gui/utils/mocks/generate-xrootd-api-templates';

// See: oneprovider-gui/services/onedata-connection for mocked templates
const OnedataConnection = Service.extend({
  init() {
    this._super(...arguments);
    this.set('apiTemplates', { xrootd: generateXrootdApiTemplates() });
  },
});

describe('Unit | Service | xrootd api generator', function () {
  setupTest('service:xrootd-api-generator', {});

  beforeEach(function () {
    registerService(this, 'onedataConnection', OnedataConnection);
  });

  it('generates xrootd command for downloadSharedFileContent', function () {
    const service = this.subject();
    expect(service.downloadSharedFileContent({
      spaceId: 'space_id',
      shareId: 'share_id',
      path: '/example/path.bin',
    })).to.equal(
      "xrdcp 'root://test.onedata.org//data/space_id/space_id/share_id/example/path.bin' '.'"
    );
  });

  it('generates xrootd command for downloadSharedDirectoryContent', function () {
    const service = this.subject();
    expect(service.downloadSharedDirectoryContent({
      spaceId: 'space_id',
      shareId: 'share_id',
      path: '/example/path',
    })).to.equal(
      "xrdcp -r 'root://test.onedata.org//data/space_id/space_id/share_id/example/path' '.'"
    );
  });

  it('generates xrootd command for listSharedDirectoryChildren', function () {
    const service = this.subject();
    expect(service.listSharedDirectoryChildren({
      spaceId: 'space_id',
      shareId: 'share_id',
      path: '/example/path',
    })).to.equal(
      "xrdfs 'root://xrootd.hub.archiver-otc.eu' ls /data/space_id/space_id/share_id/example/path"
    );
  });

  it('escapes paths in templates', function () {
    const service = this.subject();
    expect(service.listSharedDirectoryChildren({
      spaceId: 'space_id',
      shareId: 'share_id',
      path: '/example/$(rm -rf)',
    })).to.equal(
      "xrdfs 'root://xrootd.hub.archiver-otc.eu' ls '/data/space_id/space_id/share_id/example/$(rm -rf)'",
    );
  });
});
