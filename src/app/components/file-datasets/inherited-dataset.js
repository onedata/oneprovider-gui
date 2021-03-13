import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, promise, array } from 'ember-awesome-macros';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['inherited-dataset'],

  i18nPrefix: 'components.fileDatasets.inheritedDataset',

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  close: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  enabledIcon: 'checked',

  disabledIcon: 'x',

  fileProxy: reads('dataset.rootFile'),

  file: reads('fileProxy.content'),

  filePathProxy: promise.object(computed(
    'fileProxy.{name,parent}',
    async function filePathProxy() {
      const file = await this.get('fileProxy');
      return await resolveFilePath(file);
    }
  )),

  filePath: reads('filePathProxy.content'),

  filePathStringProxy: promise.object(computed(async function filePathStringProxy() {
    const filePath = await this.get('filePathProxy');
    return stringifyFilePath(filePath);
  })),

  filePathString: reads('filePathStringProxy.content'),

  fileHref: computed('file.entityId', function qosSourceFileHref() {
    const {
      getDataUrl,
      file,
    } = this.getProperties('getDataUrl', 'file');
    const fileId = get(file, 'entityId');
    return getDataUrl({ fileId: null, selected: [fileId] });
  }),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isDataProtected: array.includes(
    'dataset.protectionFlags',
    raw('data_protection')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isMetadataProtected: array.includes(
    'dataset.protectionFlags',
    raw('metadata_protection')
  ),

  dataFlagIcon: conditional(
    'isDataProtected',
    'enabledIcon',
    'disabledIcon',
  ),

  dataFlagLabelText: conditional(
    'isDataProtected',
    raw('Data write protection is enabled'),
    raw('Data write protection is disabled'),
  ),

  flagDataRowClass: conditional(
    'isDataProtected',
    raw('enabled'),
    raw('disabled'),
  ),

  metadataFlagIcon: conditional(
    'isMetadataProtected',
    'enabledIcon',
    'disabledIcon',
  ),

  metadataFlagLabelText: conditional(
    'isMetadataProtected',
    raw('Metadata write protection is enabled'),
    raw('Metadata write protection is disabled')
  ),

  flagMetadataRowClass: conditional(
    'isMetadataProtected',
    raw('enabled'),
    raw('disabled'),
  ),

  actions: {
    fileLinkClicked(event) {
      this.get('close')();
      event.stopPropagation();
    },
  },
});
