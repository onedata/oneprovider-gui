import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import { click } from 'ember-native-dom-helpers';
import hbs from 'htmlbars-inline-precompile';
import { resolve } from 'rsvp';
import EmberPowerSelectHelper from '../../helpers/ember-power-select-helper';
import $ from 'jquery';
import sinon from 'sinon';

describe('Integration | Component | acl editor', function () {
  this.timeout(5000);
  setupComponentTest('acl-editor', {
    integration: true,
  });

  beforeEach(function () {
    const users = [{
      constructor: { modelName: 'user' },
      entityId: 'user1',
      name: 'User 1',
    }, {
      constructor: { modelName: 'user' },
      entityId: 'user2',
      name: 'User 2',
    }];
    const groups = [{
      constructor: { modelName: 'group' },
      entityId: 'group1',
      name: 'Group 1',
    }, {
      constructor: { modelName: 'group' },
      entityId: 'group2',
      name: 'Group 2',
    }];
    const systemSubjects = [{
      isSystemSubject: true,
      entityId: 'OWNER@',
      equivalentType: 'user',
      name: 'owner',
    }];
    const acl = [{
      aceType: 'ALLOW',
      aceFlags: 0x00000000,
      identifier: 'user1',
      aceMask: 0x00000001, // read_object
      subject: users.findBy('entityId', 'user1'),
    }, {
      aceType: 'DENY',
      aceFlags: 0x00000040, // represents group
      identifier: 'group1',
      aceMask: 0x00000180, // read/write_attributes
      subject: groups.findBy('entityId', 'group1'),
    }];

    this.setProperties({
      users,
      groups,
      systemSubjects,
      acl,
    });
  });

  it('renders empty ACL', function () {
    this.set('acl', []);
    this.render(hbs `
      {{acl-editor
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    expect(this.$('.ace')).to.not.exist;
    expect(this.$('.no-ace')).to.exist;
  });

  it('renders passed ACL', function () {
    this.render(hbs `
      {{acl-editor
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const toCheck = [{
      name: 'User 1',
      selected: ['field-data-read_object'],
    }, {
      name: 'Group 1',
      selected: [
        'field-attributes-read_attributes',
        'field-attributes-write_attributes',
      ],
    }];

    let testPromise = resolve();
    toCheck.map(({ name, selected }, index) => {
      const selectorPrefix =
        `.one-collapsible-list-item:nth-child(${index + 1}) `;
      testPromise = testPromise.then(() =>
        click(selectorPrefix + '.one-collapsible-list-item-header')
      ).then(() => {
        expect(this.$(selectorPrefix + '.subject-name')).to.contain(name);
        selected.forEach(toggleField => {
          expect(this.$(selectorPrefix + '.' + toggleField))
            .to.have.class('checked');
        });
        expect(this.$(selectorPrefix +
            '.has-checkbox-group .one-tree .one-way-toggle.checked'))
          .to.have.length(selected.length);
      });

    });

    return testPromise;
  });

  it('adds new ACE', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [...acl, {
      aceType: 'ALLOW',
      aceFlags: 0,
      identifier: 'user2',
      aceMask: 0,
      subject: this.get('users').findBy('entityId', 'user2'),
    }];

    const addAceDropdown =
      new EmberPowerSelectHelper('.add-user-group-ace', '.add-user-group-ace-dropdown');
    return addAceDropdown.selectOption(4).then(() => {
      expect(this.$('.ace')).to.have.length(3);
      expect(this.$('.ace:nth-child(3) .subject-name')).to.contain('User 2');
      expect(changeSpy).to.be.calledWith(targetAcl);
    });
  });

  it('removes ACE', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [acl[1]];

    return click('.one-collapsible-list-item:first-child .btn-menu-toggle')
      .then(() => click($('body .webui-popover .remove-action')[0]))
      .then(() => {
        expect(this.$('.ace')).to.have.length(1);
        expect(changeSpy).to.be.calledWith(targetAcl);
      });
  });

  it('moves ACE up', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [acl[1], acl[0]];

    return click('.one-collapsible-list-item:nth-child(2) .btn-menu-toggle')
      .then(() => click($('body .webui-popover .move-up-action')[0]))
      .then(() => {
        expect(this.$('.ace:first-child .subject-name')).to.contain('Group 1');
        expect(changeSpy).to.be.calledWith(targetAcl);
      });
  });

  it('moves ACE down', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [acl[1], acl[0]];

    return click('.one-collapsible-list-item:first-child .btn-menu-toggle')
      .then(() => click($('body .webui-popover .move-down-action')[0]))
      .then(() => {
        expect(this.$('.ace:nth-child(2) .subject-name')).to.contain('User 1');
        expect(changeSpy).to.be.calledWith(targetAcl);
      });
  });

  it('changes ACE type', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [Object.assign({}, acl[0], { aceType: 'DENY' }), acl[1]];

    const selectorPrefix = '.one-collapsible-list-item:first-child ';
    return click(selectorPrefix + '.one-collapsible-list-item-header')
      .then(() => click(selectorPrefix + '.ace-type-deny'))
      .then(() => expect(changeSpy).to.be.calledWith(targetAcl));
  });

  it('adds permission restriction', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [Object.assign({}, acl[0], { aceMask: 0x00000003 }), acl[1]];

    const selectorPrefix = '.one-collapsible-list-item:first-child ';
    return click(selectorPrefix + '.one-collapsible-list-item-header')
      .then(() => click(selectorPrefix + '.field-data-write_object'))
      .then(() => expect(changeSpy).to.be.calledWith(targetAcl));
  });

  it('removes permission restriction', function () {
    const changeSpy = sinon.spy();
    this.on('change', changeSpy);
    this.render(hbs `
      {{acl-editor
        onChange=(action "change")
        context="file"
        users=users
        groups=groups
        systemSubjects=systemSubjects
        acl=acl}}
    `);

    const acl = this.get('acl');
    const targetAcl = [Object.assign({}, acl[0], { aceMask: 0x00000000 }), acl[1]];

    const selectorPrefix = '.one-collapsible-list-item:first-child ';
    return click(selectorPrefix + '.one-collapsible-list-item-header')
      .then(() => click(selectorPrefix + '.field-data-read_object'))
      .then(() => expect(changeSpy).to.be.calledWith(targetAcl));
  });
});
