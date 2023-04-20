import { click, findAll, settled } from '@ember/test-helpers';
import { expect } from 'chai';
import sleep from 'onedata-gui-common/utils/sleep';
import { findAllByText } from './find';
import globals from 'onedata-gui-common/utils/globals';

export function getFileRow({ entityId, name }) {
  let row;
  if (entityId) {
    row = findAll(`.fb-table-row[data-row-id="${entityId}"]`);
  } else {
    row = findAllByText(name, '.fb-table-row');
  }
  expect(row).to.have.length(1);
  return row[0];
}

export async function doubleClickFile(file) {
  const row = getFileRow(file);
  click(row);
  await sleep(1);
  await click(row);
}

export async function openFileContextMenu(file) {
  const row = getFileRow(file);
  row.dispatchEvent(new Event('contextmenu'));
  await settled();
  const fileActions = globals.document.querySelectorAll('.file-actions');
  expect(fileActions, 'file-actions').to.have.length(1);
  return fileActions[0];
}

export async function chooseFileContextMenuAction(file, actionId) {
  const fileActions = await openFileContextMenu(file);
  const action = fileActions.querySelector(`.file-action-${actionId}`);
  expect(action, `action item ${actionId}`).to.exist;
  await click(action);
}
