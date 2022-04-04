import BaseModel from './-base-model';
import _ from 'lodash';

export default _.merge(_.cloneDeep(BaseModel), {
  archiveId: {
    label: 'Archive ID',
  },
  config: {
    label: 'Initial configuration',
    tip: 'Configuration that was provided during creation of this archive.',
  },
  preservedCallback: {
    label: 'Preserved callback URL',
    tip: callbackTipText('persisting'),
  },
  purgedCallback: {
    label: 'Purged callback URL',
    tip: callbackTipText('deleting'),
  },
});

function callbackTipText(actionName) {
  return `URL on which a POST request will be performed to notify that the archive ${actionName} process has finished. Consult the API documentation for more details.`;
}
