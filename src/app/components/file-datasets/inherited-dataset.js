import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { conditional, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['inherited-dataset'],

  i18nPrefix: 'components.fileDatasets.inheritedDataset',

  enabledIcon: 'checked',
  disabledIcon: 'x',

  file: undefined,

  dataFlagIcon: conditional(
    'file.isDataProtected',
    'enabledIcon',
    'disabledIcon',
  ),

  dataFlagLabelText: conditional(
    'file.isDataProtected',
    raw('Data write protection is enabled'),
    raw('Data write protection is disabled'),
  ),

  flagDataRowClass: conditional(
    'file.isDataProtected',
    raw('enabled'),
    raw('disabled'),
  ),

  metadataFlagIcon: conditional(
    'file.isMetadataProtected',
    'enabledIcon',
    'disabledIcon',
  ),

  metadataFlagLabelText: conditional(
    'file.isMetadataProtected',
    raw('Metadata write protection is enabled'),
    raw('Metadata write protection is disabled')
  ),

  flagMetadataRowClass: conditional(
    'file.isMetadataProtected',
    raw('enabled'),
    raw('disabled'),
  ),
});
