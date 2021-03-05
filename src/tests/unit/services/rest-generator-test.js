import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { registerService, lookupService } from '../../helpers/stub-service';
import { set } from '@ember/object';
import Service from '@ember/service';

const OnedataConnection = Service.extend({
  init() {
    this._super(...arguments);
    this.set('restTemplates', {});
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
  ].forEach(methodName => testUrlGeneratingMethod(methodName));
});

function testUrlGeneratingMethod(methodName, templateName = methodName) {
  it(`generates URL for ${methodName} method using "${templateName}" template`, function () {
    const id = '1234';
    set(
      lookupService(this, 'onedataConnection'),
      `restTemplates.${templateName}`,
      `https://onezone.org/{{id}}/${methodName}`
    );
    const service = this.subject();
    expect(service[methodName](id))
      .to.equal(`https://onezone.org/1234/${methodName}`);
  });
}
