import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import Service from '@ember/service';
import { registerService } from '../../../helpers/stub-service';
import { triggerEvent } from 'ember-native-dom-helpers';
import $ from 'jquery';
import { RuntimeProperties as FileRuntimeProperties } from 'oneprovider-gui/models/file';
import EmberObject, { set } from '@ember/object';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const currentUser = Service.extend({
  userId,
});

const FileMock = EmberObject.extend(FileRuntimeProperties);

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

  it('does not render "hard links" file tag, when hardlinks count equals 1', function () {
    this.set('file', createFile({ hardlinksCount: 1 }));

    this.render(hbs `{{file-browser/fb-table-row file=file }}`);

    expect(this.$('.file-status-hardlinks'), 'refs tag').to.not.exist;
  });

  it('renders "hard links" file tag, when hardlinks count equals 2', function () {
    this.set('file', createFile({ hardlinksCount: 2 }));

    this.render(hbs `{{file-browser/fb-table-row file=file }}`);

    const $tag = this.$('.file-status-hardlinks');
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

  it('renders qos tag with inherited icon if file has effective qos, but not direct', function () {
    this.set('file', createFile({
      effQosMembership: 'ancestor',
    }));

    render(this);

    expect(this.$('.qos-inherited-icon')).to.exist;
  });

  it('renders dataset tag with inherited icon if file has an effective dataset, but not direct', function () {
    this.set('file', createFile({
      effDatasetMembership: 'ancestor',
    }));

    render(this);

    expect(this.$('.file-status-dataset'), 'file-status-dataset').to.exist;
    expect(this.$('.dataset-inherited-icon'), 'inherited icon').to.exist;
  });

  it('renders dataset tag without inherited icon if file has direct dataset', function () {
    this.set('file', createFile({
      effDatasetMembership: 'direct',
    }));

    render(this);

    expect(this.$('.file-status-dataset'), 'file-status-dataset').to.exist;
    expect(this.$('.dataset-inherited-icon'), 'inherited icon').to.not.exist;
  });

  it('renders dataset tag as disabled if file has dataset, but not having space_view privileges', function () {
    this.set('datasetsViewForbidden', true);
    this.set('file', createFile({
      effDatasetMembership: 'direct',
    }));

    render(this);

    const $tag = this.$('.file-status-dataset');
    expect($tag, 'file-status-dataset').to.exist;
    expect($tag).to.have.class('file-status-tag-disabled');
  });

  testProtectedFlag(['data']);
  testProtectedFlag(['metadata']);
  testProtectedFlag(['data', 'metadata']);

  ['file', 'dir'].forEach(type => {
    const typeText = type === 'file' ? 'file' : 'directory';

    testShowsTooltip(
      `protection tag for ${typeText} with data_protection flag`,
      `This ${typeText}'s data is write protected.`,
      '.file-status-protected', {
        file: createFile({
          type,
          effProtectionFlags: ['data_protection'],
          effDatasetMembership: 'ancestor',
        }),
      }
    );

    testShowsTooltip(
      `protection tag for ${typeText} with metadata_protection flag`,
      `This ${typeText}'s metadata is write protected.`,
      '.file-status-protected', {
        file: createFile({
          type,
          effProtectionFlags: ['metadata_protection'],
          effDatasetMembership: 'ancestor',
        }),
      }
    );

    testShowsTooltip(
      `protection tag for ${typeText} with data_protection and metadata_protection flag`,
      `This ${typeText}'s data and metadata are write protected.`,
      '.file-status-protected', {
        file: createFile({
          type,
          effProtectionFlags: ['data_protection', 'metadata_protection'],
          effDatasetMembership: 'ancestor',
        }),
      }
    );
  });
});

function testProtectedFlag(flagTypes) {
  const flagsText = flagTypes.join(', ');
  const effProtectionFlags = flagTypes.map(type => `${type}_protection`);
  const fileFlagsText = effProtectionFlags.map(flag => `"${flag}"`).join(', ');
  const pluralText = flagTypes.length > 1 ? 's' : '';
  const description =
    `renders only ${flagsText} protected icon${pluralText} inside dataset tag group if file has ${fileFlagsText} flag${pluralText}`;
  it(description, async function (done) {
    this.set(
      'file',
      createFile({ effProtectionFlags, effDatasetMembership: 'ancestor' })
    );

    this.render(hbs `{{file-browser/fb-table-row
      file=file
    }}`);

    expect(this.$('.file-protected-icon')).to.have.length(effProtectionFlags.length);
    flagTypes.forEach(type => {
      expect(this.$(
        `.dataset-file-status-tag-group .file-status-protected .file-${type}-protected-icon`
      )).to.have.length(1);
    });

    done();
  });
}

function testShowsTooltip(elementDescription, text, selector, contextData) {
  it(`shows tooltip containing "${text}" when hovering ${elementDescription}`, async function (done) {
    this.setProperties(contextData);

    render(this);
    await triggerEvent(selector, 'mouseenter');

    const $tooltip = $('.tooltip.in');
    expect($tooltip, 'opened tooltip').to.have.length(1);
    expect($tooltip.text()).to.contain(text);

    done();
  });
}

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
  const data = Object.assign({
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

  const file = FileMock.create(data);
  if (!data.type !== 'symlink') {
    set(file, 'effFile', data);
  }
  return file;
}

function render(testCase) {
  testCase.render(hbs `{{file-browser/fb-table-row
    file=file
    previewMode=previewMode
    isSpaceOwned=isSpaceOwned
    datasetsViewForbidden=datasetsViewForbidden
  }}`);
}
