import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find } from '@ember/test-helpers';
import { all as allFulfilled } from 'rsvp';
import Helper from '../../../helpers/file-permissions';

describe('Integration | Component | file-permissions/body', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.helper?.destroy();
  });

  it('renders visible POSIX permissions editor when all files permissions are the same POSIX', async function () {
    this.helper = new Helper(this);
    this.helper.files = await allFulfilled([
      this.helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
      this.helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
    ]);

    await this.helper.renderBody();

    const element = this.helper.getBody();
    const posixEditor = this.helper.getPosixPermissionsEditor();
    expect(element).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
    expect(find('.alert')).to.not.exist;
  });

  it('renders incompatible POSIX permissions alert when files permissions have different POSIX',
    async function () {
      this.helper = new Helper(this);
      await this.helper.givenDifferentPosix();

      await this.helper.renderBody();

      this.helper.thenExpectHiddenPosixEditor();
      const alertElement = find('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-warning');
      expect(alertElement).to.contain.text(
        'Selected items have different POSIX permissions.'
      );
    }
  );

  it('renders readonly incompatible POSIX permissions alert when files permissions have different POSIX and editor is readonly',
    async function () {
      this.helper = new Helper(this);
      this.helper.viewModelOptions = {
        readonly: true,
      };
      await this.helper.givenDifferentPosix();

      await this.helper.renderBody();

      this.helper.thenExpectHiddenPosixEditor();
      const alertElement = find('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-info');
      expect(alertElement).to.contain.text(
        'Selected items have different POSIX permissions.'
      );
      expect(alertElement).to.contain.text(
        'There is at least one item with POSIX permissions that you don\'t own, preventing batch modification.'
      );
    }
  );

  it('renders visible ACL permissions editor when all files permissions are the same ACL', async function () {
    this.helper = new Helper(this);
    const acls = await allFulfilled([
      this.helper.createAcl([this.helper.createExampleAce(0)]),
      this.helper.createAcl([this.helper.createExampleAce(0)]),
    ]);
    this.helper.files = await allFulfilled([
      this.helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      this.helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await this.helper.renderBody();

    const element = this.helper.getBody();
    const aclEditor = this.helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.not.exist;
    expect(element).to.exist;
    expect(aclEditor).to.not.have.class('hidden');
  });

  it('renders "different ACL" alert when both files have ACL but with different rules',
    async function () {
      this.helper = new Helper(this);
      await this.helper.givenDifferentAcl();

      await this.helper.renderBody();

      const element = this.helper.getBody();
      const alertElement = element.querySelector('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-warning');
      expect(alertElement).to.contain.text('Selected items have different ACL rules.');
    }
  );

  it('renders "readonly different ACL" alert when both files have ACL but with different rules in readonly mode',
    async function () {
      this.helper = new Helper(this);
      this.helper.viewModelOptions = {
        readonly: true,
      };
      await this.helper.givenDifferentAcl();

      await this.helper.renderBody();

      const element = this.helper.getBody();
      const alertElement = element.querySelector('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-info');
      expect(alertElement).to.contain.text(
        'Selected items have different ACL rules.'
      );
      expect(alertElement).to.contain.text(
        'To view them, select an individual item or items with the same rules.'
      );
    }
  );

  it('renders "different ACL" alert when one file have POSIX and other ACL', async function () {
    this.helper = new Helper(this);
    const acls = await allFulfilled([
      this.helper.createAcl([]),
      this.helper.createAcl([this.helper.createExampleAce()]),
    ]);
    this.helper.files = await allFulfilled([
      this.helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
        acl: acls[0],
      }),
      this.helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await this.helper.renderBody();

    const element = this.helper.getBody();
    const aclEditor = this.helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text('Selected items use a mix of ACLs and POSIX permissions.');
    expect(element).to.exist;
    expect(aclEditor).to.have.class('hidden');
  });

  it('renders "mixed file types" alert when files with ACL have mixed types', async function () {
    this.helper = new Helper(this);
    const acls = await allFulfilled([
      this.helper.createAcl([this.helper.createExampleAce(0)]),
      this.helper.createAcl([this.helper.createExampleAce(0)]),
    ]);
    this.helper.files = await allFulfilled([
      this.helper.createFile({
        type: 'file',
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      this.helper.createFile({
        type: 'dir',
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await this.helper.renderBody();

    const alertElement = this.helper.getBody().querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.have.trimmed.text(
      'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.'
    );
  });

  it('renders "readonly mixed file types" alert when files with ACL have mixed types in readonly mode',
    async function () {
      this.helper = new Helper(this);
      this.helper.viewModelOptions = {
        readonly: true,
      };
      const acls = await allFulfilled([
        this.helper.createAcl([this.helper.createExampleAce(0)]),
        this.helper.createAcl([this.helper.createExampleAce(0)]),
      ]);
      this.helper.files = await allFulfilled([
        this.helper.createFile({
          type: 'file',
          activePermissionsType: 'acl',
          acl: acls[0],
        }),
        this.helper.createFile({
          type: 'dir',
          activePermissionsType: 'acl',
          acl: acls[1],
        }),
      ]);

      await this.helper.renderBody();

      const alertElement = this.helper.getBody().querySelector('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-info');
      expect(alertElement).to.have.trimmed.text(
        'Cannot view ACL of files and directories at the same time. Select only files or only directories.'
      );
    }
  );

  it('unhides POSIX editor when clicking on clear button from "different alert"', async function () {
    this.helper = new Helper(this);
    await this.helper.givenDifferentPosix();
    await this.helper.renderBody();

    await this.helper.whenResetPermissionsIsClicked();

    this.helper.thenExpectVisiblePosixEditor();
  });

  it('unhides ACL editor when clicking on clear button from "different alert"', async function () {
    this.helper = new Helper(this);
    await this.helper.givenDifferentAcl();
    await this.helper.renderBody();

    await this.helper.whenResetPermissionsIsClicked();

    this.helper.thenExpectVisibleAclEditor();
  });
});
