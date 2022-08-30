import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import Helper from '../../../helpers/file-shares';
import { all as allSettled } from 'rsvp';
import sinon from 'sinon';
import { find, click } from 'ember-test-helpers';
import sleep from 'onedata-gui-common/utils/sleep';

describe('Integration | Component | file-shares/body', function () {
  setupRenderingTest();

  it('renders names of existing shares', async function () {
    const helper = new Helper(this);
    const shares = await allSettled([
      helper.createShare({
        name: 'one',
      }),
      helper.createShare({
        name: 'two',
      }),
    ]);
    await helper.givenFile();
    await helper.givenShares(shares);
    await helper.givenSimpleAppProxyStub();

    await helper.renderBody();
    await helper.waitForSharesLoad();

    const items = helper.getShareItems();
    expect(items).to.have.lengthOf(2);
    expect(items[0]).to.contain.text('one');
    expect(items[1]).to.contain.text('two');
  });

  it('renders links to private share view of existing shares', async function () {
    const helper = new Helper(this);
    const shares = await allSettled([
      helper.createShare({
        id: helper.createShareGri('id1'),
      }),
      helper.createShare({
        id: helper.createShareGri('id2'),
      }),
    ]);
    await helper.givenFile();
    await helper.givenShares(shares);
    const callParent = sinon.stub(helper.appProxyMock, 'callParent');
    callParent
      .withArgs('getShareUrl', sinon.match({ shareId: 'id1' }))
      .returns('https://example.com/private_share1');
    callParent
      .withArgs('getShareUrl', sinon.match({ shareId: 'id2' }))
      .returns('https://example.com/private_share2');

    await helper.renderBody();
    await helper.waitForSharesLoad();

    const items = helper.getShareItems();
    const anchors = [...items].map(item => item.querySelector('a.share-local-url'));
    expect(anchors[0]).to.have.attr('href', 'https://example.com/private_share1');
    expect(anchors[1]).to.have.attr('href', 'https://example.com/private_share2');
  });

  it('renders public URL of existing shares', async function () {
    const helper = new Helper(this);
    const shares = await allSettled([
      helper.createShare({
        publicUrl: 'https://example.com/1',
      }),
      helper.createShare({
        publicUrl: 'https://example.com/2',
      }),
    ]);
    await helper.givenFile();
    await helper.givenShares(shares);

    await helper.renderBody();
    await helper.waitForSharesLoad();

    const items = helper.getShareItems();
    const inputs = [...items].map(item =>
      item.querySelector('.row-share-public-url input')
    );
    expect(inputs[0]).to.have.value('https://example.com/1');
    expect(inputs[1]).to.have.value('https://example.com/2');
  });

  it('renders "no shares" message when file has no share', async function () {
    const helper = new Helper(this);
    await helper.givenFile({
      type: 'file',
    });
    await helper.givenShares([]);
    await helper.givenSimpleAppProxyStub();

    await helper.renderBody();
    await helper.waitForSharesLoad();

    const element = helper.getBody();
    const noSharesInfo = element.querySelector('.content-info-no-shares');
    expect(noSharesInfo).to.exist;
    expect(noSharesInfo).to.contain.text('This file is not shared');
  });
});
