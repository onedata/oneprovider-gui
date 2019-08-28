import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { registerService, lookupService } from '../../helpers/stub-service';
import Service from '@ember/service';
import sinon from 'sinon';
import Evented from '@ember/object/evented';
import { resolve } from 'rsvp';
import wait from 'ember-test-helpers/wait';
import _ from 'lodash';

const FileServer = Service.extend(Evented, {
  fetchDirChildren() {},
});

const I18n = Service.extend({
  t: () => '',
});

describe('Integration | Component | file browser', function () {
  setupComponentTest('file-browser', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'fileServer', FileServer);
    registerService(this, 'i18n', I18n);
  });

  it('renders files on list', function () {
    const entityId = 'deid';
    const name = 'Test directory';
    const dir = {
      entityId,
      name,
      type: 'dir',
      parent: resolve(null),
    };
    const files = [{
        entityId: 'f1',
        name: 'File 1',
        index: 'File 1',
      },
      {
        entityId: 'f2',
        name: 'File 2',
        index: 'File 2',
      },
      {
        entityId: 'f3',
        name: 'File 3',
        index: 'File 3',
      },
    ];
    this.set('dir', dir);
    const fileServer = lookupService(this, 'fileServer');
    const fetchDirChildren = sinon.stub(fileServer, 'fetchDirChildren')
      .resolves(files);

    this.render(hbs `{{file-browser dir=dir}}`);

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.called;
      return wait().then(() => {
        expect(this.$('.fb-table-row')).to.have.length(3);
      });
    });
  });

  it('changes directories on double click', function () {
    const numberOfDirs = 10;

    const rootDir = {
      entityId: 'root',
      name: 'Some Space',
      index: 'Some Space',
      type: 'dir',
      parent: resolve(null),
      hasParent: false,
    };

    const dirs = _.range(0, numberOfDirs).map(i => ({
      entityId: `file-${i}`,
      name: `Directory ${i}`,
      index: `Directory ${i}`,
      type: 'dir',
    }));

    for (let i = 0; i < numberOfDirs; ++i) {
      dirs[i].parent = resolve(i > 0 ? dirs[i - 1] : rootDir);
      dirs[i].hasParent = true;
    }

    this.set('dir', rootDir);
    const fileServer = lookupService(this, 'fileServer');
    const fetchDirChildren = sinon.stub(fileServer, 'fetchDirChildren');

    for (let i = -1; i < numberOfDirs; ++i) {
      fetchDirChildren.withArgs(
        i === -1 ? 'root' : `file-${i}`,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      ).resolves(i === numberOfDirs - 1 ? [] : [dirs[i + 1]]);
    }

    this.render(hbs `{{file-browser dir=dir}}`);

    let clickCount = 8;
    const enterDir = () => {
      const $row = this.$('.fb-table-row');
      $row.click();
      $row.click();
      return wait().then(() => {
        if (clickCount > 0) {
          clickCount = clickCount - 1;
          return enterDir();
        } else {
          resolve();
        }
      });
    };

    return wait().then(() => {
      expect(fetchDirChildren).to.have.been.calledWith(
        'root',
        sinon.match.any,
        sinon.match.any,
        sinon.match.any
      );
      expect(this.$('.fb-table-row')).to.have.length(1);
      return enterDir().then(() => {
        expect(this.$('.fb-table-row').text()).to.contain('Directory 9');
      });
    });
  });
});
