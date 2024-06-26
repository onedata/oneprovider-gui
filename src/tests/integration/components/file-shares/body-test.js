import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import Helper from '../../../helpers/file-shares';
import { all as allFulfilled } from 'rsvp';
import sinon from 'sinon';

describe('Integration | Component | file-shares/body', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.helper?.destroy();
  });

  it('renders names of existing shares', async function () {
    this.helper = new Helper(this);
    const shares = await allFulfilled([
      this.helper.createShare({
        name: 'one',
      }),
      this.helper.createShare({
        name: 'two',
      }),
    ]);
    await this.helper.givenFile();
    await this.helper.givenShares(shares);
    await this.helper.givenSimpleAppProxyStub();

    await this.helper.renderBody();
    await this.helper.waitForSharesLoad();

    const items = this.helper.getShareItems();
    expect(items).to.have.lengthOf(2);
    expect(items[0]).to.contain.text('one');
    expect(items[1]).to.contain.text('two');
  });

  it('renders links to private share view of existing shares', async function () {
    this.helper = new Helper(this);
    const shares = await allFulfilled([
      this.helper.createShare({
        id: this.helper.createShareGri('id1'),
      }),
      this.helper.createShare({
        id: this.helper.createShareGri('id2'),
      }),
    ]);
    await this.helper.givenFile();
    await this.helper.givenShares(shares);
    const callParent = sinon.stub(this.helper.appProxyMock, 'callParent');
    callParent
      .withArgs('getShareUrl', sinon.match({ shareId: 'id1' }))
      .returns('https://example.com/private_share1');
    callParent
      .withArgs('getShareUrl', sinon.match({ shareId: 'id2' }))
      .returns('https://example.com/private_share2');

    await this.helper.renderBody();
    await this.helper.waitForSharesLoad();

    const items = this.helper.getShareItems();
    const anchors = [...items].map(item => item.querySelector('a.share-local-url'));
    expect(anchors[0]).to.have.attr('href', 'https://example.com/private_share1');
    expect(anchors[1]).to.have.attr('href', 'https://example.com/private_share2');
  });

  it('renders public URL of existing shares', async function () {
    this.helper = new Helper(this);
    const shares = await allFulfilled([
      this.helper.createShare({
        publicUrl: 'https://example.com/1',
      }),
      this.helper.createShare({
        publicUrl: 'https://example.com/2',
      }),
    ]);
    await this.helper.givenFile();
    await this.helper.givenShares(shares);

    await this.helper.renderBody();
    await this.helper.waitForSharesLoad();

    const items = this.helper.getShareItems();
    const inputs = [...items].map(item =>
      item.querySelector('.row-share-public-url input')
    );
    expect(inputs[0]).to.have.value('https://example.com/1');
    expect(inputs[1]).to.have.value('https://example.com/2');
  });

  it('renders "no shares" message when file has no share', async function () {
    this.helper = new Helper(this);
    await this.helper.givenFile({
      type: 'file',
    });
    await this.helper.givenShares([]);
    await this.helper.givenSimpleAppProxyStub();

    await this.helper.renderBody();
    await this.helper.waitForSharesLoad();

    const element = this.helper.getBody();
    const noSharesInfo = element.querySelector('.content-info-no-shares');
    expect(noSharesInfo).to.exist;
    expect(noSharesInfo).to.contain.text('This file is not shared');
  });
});
