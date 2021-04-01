import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import Service from '@ember/service';
import { registerService } from '../../../helpers/stub-service';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const currentUser = Service.extend({
  userId,
});

describe('Integration | Component | file browser/fb table row', function () {
  setupComponentTest('file-browser/fb-table-row', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'currentUser', currentUser);
  });

  it('renders modification date', function () {
    const date = moment('2022-05-18T08:50:00+00:00').unix();
    const dateReadable = /18 May 2022 \d+:50/;
    this.set('file', createFile({ modificationTime: date }));

    this.render(hbs `{{file-browser/fb-table-row file=file}}`);

    expect(this.$('.fb-table-col-modification').text()).to.match(dateReadable);
  });

  it('does not render "hard links" file tag, when references count equals 1', function () {
    this.set('file', createFile({ referencesCount: 1 }));

    this.render(hbs `{{file-browser/fb-table-row file=file }}`);

    expect(this.$('.file-status-references'), 'refs tag').to.not.exist;
  });

  it('renders "hard links" file tag, when references count equals 2', function () {
    this.set('file', createFile({ referencesCount: 2 }));

    this.render(hbs `{{file-browser/fb-table-row file=file }}`);

    const $tag = this.$('.file-status-references');
    expect($tag, 'hard links tag').to.exist;
    expect($tag.text().trim()).to.equal('2 hard links');
  });

  describe('renders "no access" file tag when', function () {
    itRendersNoAccess('user owns file and has no user read posix permissions', {
      file: createFile({ posixPermissions: '377' }),
    });

    itRendersNoAccess('user belongs to file group and has no group read posix permissions', {
      file: createFile({ posixPermissions: '737' }, 'user.test.instance:private'),
    }, );

    itRendersNoAccess('browser is in preview and user has no "other" read posix permissions', {
      file: createFile({ posixPermissions: '773' }),
      previewMode: true,
    }, );

    function itRendersNoAccess(description, properties) {
      checkNoAccessTag({
        renders: true,
        description,
        properties,
      });
    }
  });

  describe('does not render "no access" file tag when', function () {
    itDoesNotRenderNoAccess('user has full posix permissions', {
      file: createFile({ posixPermissions: '777' }),
    });

    itDoesNotRenderNoAccess('user is space owner and does not have any read permissions', {
      file: createFile({ posixPermissions: '333' }),
      isSpaceOwned: true,
    });

    function itDoesNotRenderNoAccess(description, properties) {
      checkNoAccessTag({
        renders: false,
        description,
        properties,
      });
    }
  });
});

function checkNoAccessTag({ renders, description, properties }) {
  it(description, function () {
    this.setProperties(properties);

    this.render(hbs `{{file-browser/fb-table-row
      file=file
      previewMode=previewMode
      isSpaceOwned=isSpaceOwned
    }}`);

    const expector = expect(this.$('.file-status-forbidden'), 'forbidden tag');
    if (renders) {
      expector.to.exist;
    } else {
      expector.to.not.exist;
    }
  });
}

function createFile(override = {}, ownerGri = userGri) {
  const file = Object.assign({
    modificationTime: moment('2020-01-01T08:50:00+00:00').unix(),
    posixPermissions: '777',
    type: 'file',
    belongsTo(name) {
      if (name === 'owner') {
        return {
          id: () => ownerGri,
        };
      }
    },
  }, override);
  if (!file.type !== 'symlink') {
    file.effFile = file;
  }
  return file;
}
