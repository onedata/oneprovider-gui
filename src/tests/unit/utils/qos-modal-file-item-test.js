import { expect } from 'chai';
import { describe, it } from 'mocha';
import QosModalFileItem from 'oneprovider-gui/utils/qos-modal-file-item';
import sinon from 'sinon';
import { get } from '@ember/object';
import wait from 'ember-test-helpers/wait';
import { Promise } from 'rsvp';
import { later } from '@ember/runloop';

describe('Unit | Utility | qos modal file item', function () {
  it('has status empty when qos items loads and are empty', function () {
    const fetchFileQosSummary = sinon.stub().resolves({
      fulfilled: true,
    });
    const fetchQosItems = sinon.stub().resolves([]);
    const item = QosModalFileItem.create({
      fetchFileQosSummary,
      fetchQosItems,
    });
    expect(get(item, 'fileQosStatus')).to.equal('loading');
    return wait().then(() => {
      expect(get(item, 'fileQosStatus')).to.equal('empty');
    });
  });

  it('has status fulfilled when qosSummary loads and has fulfilled status ', function () {
    function fetchFileQosSummary() {
      return new Promise((resolve) => {
        later(() => {
          resolve({
            status: 'fulfilled',
          });
        }, 1);
      });
    }
    const fetchQosItems = sinon.stub().resolves([{}]);
    const item = QosModalFileItem.create({
      fetchFileQosSummary,
      fetchQosItems,
    });
    expect(get(item, 'fileQosStatus'), 'before items resolve').to.equal('loading');
    return get(item, 'qosItemsProxy').then(() => {
      expect(get(item, 'fileQosStatus'), 'before summary resolve').to.equal('loading');
      return get(item, 'fileQosSummaryProxy').then(() => {
        expect(get(item, 'fileQosStatus')).to.equal('fulfilled');
      });
    });
  });

  it('has status pending when qosSummary loads and has pending status',
    function () {
      function fetchFileQosSummary() {
        return new Promise((resolve) => {
          later(() => {
            resolve({
              status: 'pending',
            });
          }, 1);
        });
      }
      const fetchQosItems = sinon.stub().resolves([{}]);
      const item = QosModalFileItem.create({
        fetchFileQosSummary,
        fetchQosItems,
      });
      expect(get(item, 'fileQosStatus'), 'before items resolve').to.equal('loading');
      return get(item, 'qosItemsProxy').then(() => {
        expect(get(item, 'fileQosStatus'), 'before summary resolve').to.equal('loading');
        return get(item, 'fileQosSummaryProxy').then(() => {
          expect(get(item, 'fileQosStatus')).to.equal('pending');
        });
      });
    }
  );

  it('has status error when qosSummary rejects',
    function () {
      function fetchFileQosSummary() {
        return new Promise((resolve, reject) => {
          later(() => {
            reject();
          }, 1);
        });
      }
      const fetchQosItems = sinon.stub().resolves([{}]);
      const item = QosModalFileItem.create({
        fetchFileQosSummary,
        fetchQosItems,
      });
      expect(get(item, 'fileQosStatus'), 'before items resolve').to.equal('loading');
      return get(item, 'qosItemsProxy').then(() => {
        expect(get(item, 'fileQosStatus'), 'before summary resolve').to.equal('loading');
        return get(item, 'fileQosSummaryProxy').finally(() => {
          expect(get(item, 'fileQosStatus'), 'after summary rejection').to.equal('error');
        });
      });
    }
  );

  it('has status error when qos items reject', function () {
    const fetchFileQosSummary = sinon.stub().resolves({
      fulfilled: true,
    });
    const fetchQosItems = sinon.stub().rejects();
    const item = QosModalFileItem.create({
      fetchFileQosSummary,
      fetchQosItems,
    });
    expect(get(item, 'fileQosStatus')).to.equal('loading');
    return get(item, 'qosItemsProxy').catch(() => {}).finally(() => {
      expect(get(item, 'fileQosStatus')).to.equal('error');
    });
  });
});
