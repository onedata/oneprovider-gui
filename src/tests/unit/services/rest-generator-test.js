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

  it('generates shareListDirChildren', function () {
    const id = '1234';
    set(
      lookupService(this, 'onedataConnection'),
      'restTemplates.shareListDirChildren',
      'https://onezone.org/list_children/{{id}}'
    );
    const service = this.subject();
    expect(service.shareListDirChildren(id))
      .to.equal('https://onezone.org/list_children/1234');
  });

  it('generates shareDownloadFileContent', function () {
    const id = '1234';
    set(
      lookupService(this, 'onedataConnection'),
      'restTemplates.shareDownloadFileContent',
      'https://onezone.org/file_content/{{id}}'
    );
    const service = this.subject();
    expect(service.shareDownloadFileContent(id))
      .to.equal('https://onezone.org/file_content/1234');
  });

  it('generates empty string if a template is not found', function () {
    const id = '1234';
    const service = this.subject();
    expect(service.shareListDirChildren(id))
      .to.equal('');
  });
});
