import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find } from '@ember/test-helpers';
import { all as allFulfilled } from 'rsvp';
import Helper from '../../../helpers/file-permissions';

describe('Integration | Component | file-permissions/body', function () {
  setupRenderingTest();

  it('renders visible POSIX permissions editor when all files permissions are the same POSIX', async function () {
    const helper = new Helper(this);
    helper.files = await allFulfilled([
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
    ]);

    await helper.renderBody();

    const element = helper.getBody();
    const posixEditor = helper.getPosixPermissionsEditor();
    expect(element).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
    expect(find('.alert')).to.not.exist;
  });

  it('renders incompatible POSIX permissions alert when files permissions have different POSIX',
    async function () {
      const helper = new Helper(this);
      await helper.givenDifferentPosix();

      await helper.renderBody();

      helper.thenExpectHiddenPosixEditor();
      const alertElement = find('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-warning');
      expect(alertElement).to.contain.text(
        'Selected files have different POSIX permissions.'
      );
    }
  );

  it('renders readonly incompatible POSIX permissions alert when files permissions have different POSIX and editor is readonly',
    async function () {
      const helper = new Helper(this);
      helper.viewModelOptions = {
        readonly: true,
      };
      await helper.givenDifferentPosix();

      await helper.renderBody();

      helper.thenExpectHiddenPosixEditor();
      const alertElement = find('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-info');
      expect(alertElement).to.contain.text(
        'Selected files have different POSIX permissions. Select an individual file or files with the same permissions.'
      );
    }
  );

  it('renders visible ACL permissions editor when all files permissions are the same ACL', async function () {
    const helper = new Helper(this);
    const acls = await allFulfilled([
      helper.createAcl([helper.createExampleAce(0)]),
      helper.createAcl([helper.createExampleAce(0)]),
    ]);
    helper.files = await allFulfilled([
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.renderBody();

    const element = helper.getBody();
    const aclEditor = helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.not.exist;
    expect(element).to.exist;
    expect(aclEditor).to.not.have.class('hidden');
  });

  it('renders "different ACL" alert when both files have ACL but with different rules',
    async function () {
      const helper = new Helper(this);
      await helper.givenDifferentAcl();

      await helper.renderBody();

      const element = helper.getBody();
      const alertElement = element.querySelector('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-warning');
      expect(alertElement).to.contain.text('Selected files have different ACL rules.');
    }
  );

  it('renders "readonly different ACL" alert when both files have ACL but with different rules in readonly mode',
    async function () {
      const helper = new Helper(this);
      helper.viewModelOptions = {
        readonly: true,
      };
      await helper.givenDifferentAcl();

      await helper.renderBody();

      const element = helper.getBody();
      const alertElement = element.querySelector('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-info');
      expect(alertElement).to.contain.text(
        'Selected files have different ACL rules. Select an individual file or files with the same rules.'
      );
    }
  );

  it('renders "different ACL" alert when one file have POSIX and other ACL', async function () {
    const helper = new Helper(this);
    const acls = await allFulfilled([
      helper.createAcl([]),
      helper.createAcl([helper.createExampleAce()]),
    ]);
    helper.files = await allFulfilled([
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
        acl: acls[0],
      }),
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.renderBody();

    const element = helper.getBody();
    const aclEditor = helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text('Selected files have different ACL rules.');
    expect(element).to.exist;
    expect(aclEditor).to.have.class('hidden');
  });

  it('renders "mixed file types" alert when files with ACL have mixed types', async function () {
    const helper = new Helper(this);
    const acls = await allFulfilled([
      helper.createAcl([helper.createExampleAce(0)]),
      helper.createAcl([helper.createExampleAce(0)]),
    ]);
    helper.files = await allFulfilled([
      helper.createFile({
        type: 'file',
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      helper.createFile({
        type: 'dir',
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.renderBody();

    const alertElement = helper.getBody().querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.have.trimmed.text(
      'Cannot view ACL of files and directories at the same time. Select only files or only directories to enable ACL editor.'
    );
  });

  it('renders "readonly mixed file types" alert when files with ACL have mixed types in readonly mode',
    async function () {
      const helper = new Helper(this);
      helper.viewModelOptions = {
        readonly: true,
      };
      const acls = await allFulfilled([
        helper.createAcl([helper.createExampleAce(0)]),
        helper.createAcl([helper.createExampleAce(0)]),
      ]);
      helper.files = await allFulfilled([
        helper.createFile({
          type: 'file',
          activePermissionsType: 'acl',
          acl: acls[0],
        }),
        helper.createFile({
          type: 'dir',
          activePermissionsType: 'acl',
          acl: acls[1],
        }),
      ]);

      await helper.renderBody();

      const alertElement = helper.getBody().querySelector('.alert');
      expect(alertElement).to.exist;
      expect(alertElement).to.have.class('alert-info');
      expect(alertElement).to.have.trimmed.text(
        'Cannot view ACL of files and directories at the same time. Select only files or only directories.'
      );
    }
  );

  it('unhides POSIX editor when clicking on clear button from "different alert"', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentPosix();
    await helper.renderBody();

    await helper.whenResetPermissionsIsClicked();

    helper.thenExpectVisiblePosixEditor();
  });

  it('unhides ACL editor when clicking on clear button from "different alert"', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentAcl();
    await helper.renderBody();

    await helper.whenResetPermissionsIsClicked();

    helper.thenExpectVisibleAclEditor();
  });
});
