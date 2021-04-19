import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { registerService, lookupService } from '../../helpers/stub-service';
import { set } from '@ember/object';
import Service from '@ember/service';
import { sharedRestFileTemplate } from 'oneprovider-gui/services/mocks/onedata-connection';

const OnedataConnection = Service.extend({
  init() {
    this._super(...arguments);
    this.set('apiTemplates', { rest: {} });
  },
});

describe('Unit | Service | rest generator', function () {
  setupTest('service:rest-generator', {});

  beforeEach(function () {
    registerService(this, 'onedataConnection', OnedataConnection);
  });

  it('generates empty string if a template is not found', function () {
    const id = '1234';
    const service = this.subject();
    expect(service.listSharedDirectoryChildren(id))
      .to.equal('');
  });

  [
    'listSharedDirectoryChildren',
    'downloadSharedFileContent',
    'getSharedFileAttributes',
    'getSharedFileJsonMetadata',
    'getSharedFileRdfMetadata',
    'getSharedFileExtendedAttributes',
  ].forEach(methodName => testShareDataCurlGeneratingMethod(methodName));

  // download directory content uses the same template as download file
  testShareDataCurlGeneratingMethod(
    'downloadSharedDirectoryContent',
    'downloadSharedFileContent'
  );
});

function testShareDataCurlGeneratingMethod(methodName, templateName = methodName) {
  it(`generates curl command for ${methodName} method using "${templateName}" template`, function () {
    const id = '1234';
    set(
      lookupService(this, 'onedataConnection'),
      `apiTemplates.rest.${templateName}`,
      sharedRestFileTemplate(methodName)
    );
    const service = this.subject();
    expect(service[methodName]({ cdmiObjectId: id })).to.equal(
      `curl -L 'https://test.onedata.org/api/v3/onezone/shares/data/1234/${methodName}'`
    );
  });
}
