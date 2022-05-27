import BaseModel, { baseArchiveIntro } from './-base-model';
import _ from 'lodash';

export default _.merge(_.cloneDeep(BaseModel), {
  baseArchiveDeleted: 'deleted',
  baseArchiveId: 'ID',
  archiveId: {
    label: 'Archive ID',
  },
  config: {
    label: 'Initial configuration',
    tip: 'Configuration that was provided during creation of this archive.',
    baseArchiveGroup: {
      baseArchiveInfo: {
        label: 'Base archive',
        tip: `<p>${baseArchiveIntro}</p>`,
      },
    },
  },
  preservedCallback: {
    label: 'Preserved callback URL',
    tip: callbackTipText('persisting'),
  },
  deletedCallback: {
    label: 'Deleted callback URL',
    tip: callbackTipText('deleting'),
  },
});

function callbackTipText(actionName) {
  return `URL on which a POST request will be performed to notify that the archive ${actionName} process has finished. Consult the API documentation for more details.`;
}
