import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import { registerService, lookupService } from '../../helpers/stub-service';
import { set } from '@ember/object';
import Service from '@ember/service';

const apiOrigin = 'oneprovider1.local-onedata.org';

const OnedataConnection = Service.extend({
  init() {
    this._super(...arguments);
    this.set('restTemplates', {});
  },
});

const GuiContext = Service.extend({
  apiOrigin,
});

describe('Unit | Service | rest generator', function () {
  setupTest('service:rest-generator', {});

  beforeEach(function () {
    registerService(this, 'onedataConnection', OnedataConnection);
    registerService(this, 'guiContext', GuiContext);
  });

  it('generates listChildren', function () {
    const id = '1234';
    set(
      lookupService(this, 'onedataConnection'),
      'restTemplates.listChildren',
      '/api/v3/something/{{id}}/list'
    );
    const service = this.subject();
    expect(service.listChildren(id))
      .to.equal(`https://${apiOrigin}/api/v3/something/1234/list`);
  });

  it('generates downloadFileContent', function () {
    const id = '1234';
    set(
      lookupService(this, 'onedataConnection'),
      'restTemplates.downloadFileContent',
      '/api/v3/something/{{id}}/content'
    );
    const service = this.subject();
    expect(service.downloadFileContent(id))
      .to.equal(`https://${apiOrigin}/api/v3/something/1234/content`);
  });

  it('generates empty string if a template is not found', function () {
    const id = '1234';
    const service = this.subject();
    expect(service.listChildren(id))
      .to.equal('');
  });
});
