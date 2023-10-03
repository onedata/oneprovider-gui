import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, triggerEvent, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import moment from 'moment';
import Service from '@ember/service';
import { registerService } from '../../../helpers/stub-service';
import { RuntimeProperties as FileRuntimeProperties } from 'oneprovider-gui/models/file';
import EmberObject, { set } from '@ember/object';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import globals from 'onedata-gui-common/utils/globals';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const currentUser = Service.extend({
  userId,
});

const FileMock = EmberObject.extend(FileRuntimeProperties);

describe('Integration | Component | file-browser/fb-table-row', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'currentUser', currentUser);
    this.set('browserModel', FilesystemBrowserModel.create({
      ownerSource: this.owner,
      firstColumnWidth: 20,
      loadColumnsConfigFromLocalStorage() {
        this.set('columns.modification.isEnabled', true);
        this.set('columns.replication.isEnabled', true);
      },
    }));
    this.set('spacePrivileges', { view: true });
  });

  afterEach(function () {
    this.get('browserModel')?.destroy?.();
  });

  it('renders modification date', async function () {
    const date = moment('2022-05-18T08:50:00+00:00').unix();
    const dateReadable = /18 May 2022 \d+:50/;
    this.set('file', createFile({ mtime: date }));

    await renderComponent(this);

    expect(find('.fb-table-col-modification').textContent).to.match(dateReadable);
  });

  it('does not render "hard links" file tag, when hardlinks count equals 1', async function () {
    this.set('file', createFile({ hardlinkCount: 1 }));

    await renderComponent(this);

    expect(find('.file-status-hardlinks'), 'refs tag').to.not.exist;
  });

  it('renders "hard links" file tag, when hardlinks count equals 2', async function () {
    this.set('file', createFile({ hardlinkCount: 2 }));

    await renderComponent(this);

    const tag = find('.file-status-hardlinks');
    expect(tag, 'hard links tag').to.exist;
    expect(tag).to.have.trimmed.text('2 hard links');
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

  it('shows qos tag with inherited icon after inherited icon click if file has effective qos, but not direct',
    async function () {
      this.set('file', createFile({
        effQosMembership: 'ancestor',
      }));

      await renderComponent(this);
      await expandInheritanceTag();

      expect(find('.qos-inherited-icon')).to.exist;
    }
  );

  it('shows dataset tag with inherited icon after inherited icon click if file has an effective dataset, but not direct',
    async function () {
      this.set('file', createFile({
        effDatasetMembership: 'ancestor',
      }));

      await renderComponent(this);
      await expandInheritanceTag();

      expect(find('.file-status-dataset'), 'file-status-dataset').to.exist;
      expect(find('.dataset-inherited-icon'), 'inherited icon').to.exist;
    }
  );

  it('renders dataset tag without inherited icon if file has direct dataset', async function () {
    this.set('file', createFile({
      effDatasetMembership: 'direct',
    }));

    await renderComponent(this);

    expect(find('.file-status-dataset'), 'file-status-dataset').to.exist;
    expect(find('.dataset-inherited-icon'), 'inherited icon').to.not.exist;
  });

  it('renders dataset tag as disabled if file has dataset, but not having space_view privileges',
    async function () {
      this.set('spacePrivileges.view', false);
      this.set('file', createFile({
        effDatasetMembership: 'direct',
      }));

      await renderComponent(this);

      const tag = find('.file-status-dataset');
      expect(tag, 'file-status-dataset').to.exist;
      expect(tag).to.have.class('file-status-tag-disabled');
    });

  it('renders dataset tag as enabled if file has dataset and has space_view privileges', async function () {
    this.set('spacePrivileges.view', true);
    this.set('file', createFile({
      effDatasetMembership: 'direct',
    }));

    await renderComponent(this);

    const tag = find('.file-status-dataset');
    expect(tag, 'file-status-dataset').to.exist;
    expect(tag).to.not.have.class('file-status-tag-disabled');
  });

  it('renders qos tag as disabled if file has direct qos, but not having space_view_qos privileges',
    async function () {
      this.set('spacePrivileges.viewQos', false);
      this.set('file', createFile({
        effQosMembership: 'direct',
      }));

      await renderComponent(this);

      const tag = find('.file-status-qos');
      expect(tag, 'file-status-qos').to.exist;
      expect(tag).to.have.class('file-status-tag-disabled');
    });

  it('renders qos tag as enabled if file has direct qos and has space_view_qos privileges', async function () {
    this.set('spacePrivileges.viewQos', true);
    this.set('file', createFile({
      effQosMembership: 'direct',
    }));

    await renderComponent(this);

    const tag = find('.file-status-qos');
    expect(tag, 'file-status-qos').to.exist;
    expect(tag).to.not.have.class('file-status-tag-disabled');
  });

  it('renders 100% replication', async function () {
    const replicationRate = 1;
    this.set('file', createFile({ localReplicationRate: replicationRate }));
    const replicationRateText = replicationRate * 100 + '%';
    enableColumn(this, 'replication');

    await renderComponent(this);

    expect(find('.fb-table-col-replication').textContent.trim()).to.equal(replicationRateText);
    expect(find('.replication-bar.full')).to.exist;
    expect(find('.replication-bar').style.width).to.equal('100%');
    expect(find('.remain-background-bar')).to.exist;
    expect(find('.remain-background-bar').style.width).to.equal('0%');
  });

  it('renders 0% replication', async function () {
    const replicationRate = 0;
    this.set('file', createFile({ localReplicationRate: replicationRate }));
    const replicationRateText = replicationRate * 100 + '%';
    enableColumn(this, 'replication');

    await renderComponent(this);

    expect(find('.fb-table-col-replication').textContent.trim()).to.equal(replicationRateText);
    expect(find('.replication-bar')).to.exist;
    expect(find('.replication-bar').style.width).to.equal('0%');
    expect(find('.remain-background-bar.full')).to.exist;
    expect(find('.remain-background-bar').style.width).to.equal('100%');
  });

  it('renders 20% replication', async function () {
    const replicationRate = 0.2;
    this.set('file', createFile({ localReplicationRate: replicationRate }));
    const replicationRateText = replicationRate * 100 + '%';
    enableColumn(this, 'replication');

    await renderComponent(this);

    expect(find('.fb-table-col-replication').textContent.trim()).to.equal(replicationRateText);
    expect(find('.replication-bar')).to.exist;
    expect(find('.replication-bar.full')).not.to.exist;
    expect(find('.replication-bar').style.width).to.equal('20%');
    expect(find('.remain-background-bar')).to.exist;
    expect(find('.remain-background-bar.full')).not.to.exist;
    expect(find('.remain-background-bar').style.width).to.equal('80%');
  });

  it('renders less than 1% replication', async function () {
    const replicationRate = 0.004;
    this.set('file', createFile({ localReplicationRate: replicationRate }));
    enableColumn(this, 'replication');

    await renderComponent(this);

    expect(find('.fb-table-col-replication').textContent.trim()).to.equal('< 1%');
    expect(find('.replication-bar.almost-empty-bar')).to.exist;
    expect(find('.replication-bar.full')).not.to.exist;
    expect(find('.replication-bar').style.width).to.equal('100%');
    expect(find('.remain-background-bar')).to.exist;
    expect(find('.remain-background-bar').style.width).to.equal('0%');
  });

  it('renders 1% replication', async function () {
    const replicationRate = 0.01;
    this.set('file', createFile({ localReplicationRate: replicationRate }));
    const replicationRateText = replicationRate * 100 + '%';
    enableColumn(this, 'replication');

    await renderComponent(this);

    expect(find('.fb-table-col-replication').textContent.trim()).to.equal(replicationRateText);
    expect(find('.replication-bar')).to.exist;
    expect(find('.replication-bar.full')).not.to.exist;
    expect(find('.replication-bar').style.width).to.equal('1%');
    expect(find('.remain-background-bar')).to.exist;
    expect(find('.remain-background-bar.full')).not.to.exist;
    expect(find('.remain-background-bar').style.width).to.equal('99%');
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
  it(description, async function () {
    this.set(
      'file',
      createFile({ effProtectionFlags, effDatasetMembership: 'ancestor' })
    );

    await renderComponent(this);
    await expandInheritanceTag();

    expect(findAll('.file-protected-icon')).to.have.length(effProtectionFlags.length);
    flagTypes.forEach(type => {
      expect(findAll(
        `.dataset-file-status-tag-group .file-status-protected .file-${type}-protected-icon`
      )).to.have.length(1);
    });
  });
}

function testShowsTooltip(elementDescription, text, selector, contextData) {
  it(`shows tooltip containing "${text}" when hovering ${elementDescription}`, async function () {
    this.setProperties(contextData);

    await renderComponent(this);
    await expandInheritanceTag();
    await triggerEvent(selector, 'mouseenter');

    const tooltip = globals.document.querySelectorAll('.tooltip.in');
    expect(tooltip, 'opened tooltip').to.have.length(1);
    expect(tooltip[0]).to.contain.text(text);
  });
}

function checkNoAccessTag({ renders, description, properties }) {
  it(description, async function () {
    this.setProperties(properties);

    await renderComponent(this);

    const expector = expect(find('.file-status-forbidden'), 'forbidden tag');
    if (renders) {
      expector.to.exist;
    } else {
      expector.to.not.exist;
    }
  });
}

// TODO: VFS-9850 Use real file model in tests
function createFile(override = {}, ownerGri = userGri) {
  const data = Object.assign({
    mtime: moment('2020-01-01T08:50:00+00:00').unix(),
    posixPermissions: '777',
    type: 'file',
    belongsTo(name) {
      if (name === 'owner') {
        return {
          id: () => ownerGri,
        };
      }
    },
    hasMany() {
      return {
        ids: () => [],
      };
    },
  }, override);

  const file = FileMock.create(data);
  if (!data.type !== 'symlink') {
    set(file, 'effFile', data);
  }
  return file;
}

async function renderComponent(testCase) {
  testCase.set('browserModel.spacePrivileges', testCase.get('spacePrivileges'));
  await render(hbs `{{file-browser/fb-table-row
    file=file
    browserModel=browserModel
    previewMode=previewMode
    isSpaceOwned=isSpaceOwned
    spacePrivileges=spacePrivileges
  }}`);
}

async function expandInheritanceTag() {
  const inheritanceTag = find('.file-status-inherited');
  await click(inheritanceTag);
}

function enableColumn(mochaContext, columnName) {
  mochaContext.set(
    `browserModel.columnsConfiguration.columns.${columnName}.isEnabled`,
    true
  );
  mochaContext.set(
    `browserModel.columnsConfiguration.columns.${columnName}.isVisible`,
    true
  );
}
