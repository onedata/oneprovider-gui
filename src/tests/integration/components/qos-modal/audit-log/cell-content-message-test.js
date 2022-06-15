import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { find } from 'ember-native-dom-helpers';

describe('Integration | Component | qos modal/audit log/cell content message', function () {
  setupComponentTest('qos-modal/audit-log/cell-content-message', {
    integration: true,
  });

  this.beforeEach(function () {
    this.helper = new Helper(this);
  });

  it('renders "Synchronization started"', async function () {
    this.setProperties({
      qosLogStatus: 'synchronization started',
    });
    await this.helper.render();
    expect(this.helper.getText()).to.equal('Synchronization started');
  });

  it('renders "Synchronization skipped" with deleted message', async function () {
    this.setProperties({
      qosLogStatus: 'synchronization skipped',
      qosLogReason: 'file deleted',
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('Synchronization skipped: file deleted');
  });

  it('renders "Synchronization skipped" with already replicated message', async function () {
    this.setProperties({
      qosLogStatus: 'synchronization skipped',
      qosLogReason: 'file already replicated',
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('Synchronization skipped: file already replicated');
  });

  it('renders unknown status message', async function () {
    this.setProperties({
      qosLogStatus: 'Hello world',
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('Hello world');
  });

  it('renders status with custom reason', async function () {
    this.setProperties({
      qosLogStatus: 'synchronization skipped',
      qosLogReason: 'foo bar',
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('Synchronization skipped: foo bar');
  });

  it('renders custom reason message', async function () {
    this.setProperties({
      qosLogReason: 'foo bar',
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('Foo bar');
  });

  it('renders empty message', async function () {
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('–');
  });

  it('renders "Synchronization failed" with known POSIX error message', async function () {
    this.setProperties({
      qosLogStatus: 'synchronization failed',
      qosLogReason: {
        id: 'posix',
        details: {
          errno: 'enospc',
        },
      },
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.equal('Synchronization failed: no space left on device');
  });

  it('renders "Synchronization failed" with custom reason', async function () {
    this.setProperties({
      qosLogStatus: 'synchronization failed',
      qosLogReason: {
        custom: true,
      },
    });
    await this.helper.render();
    expect(this.helper.getText())
      .to.match(/Synchronization failed: {\s+"custom": true\s+}/);
  });
});

class Helper {
  constructor(testCase) {
    this.testCase = testCase;
  }
  async render() {
    this.testCase.render(hbs`
      {{qos-modal/audit-log/cell-content-message
        qosLogStatus=qosLogStatus
        qosLogReason=qosLogReason
      }}
    `);
  }
  /** @returns {HTMLElement} */
  getElement() {
    return find('.cell-content-message');
  }
  getText() {
    return this.getElement().textContent.trim();
  }
}
