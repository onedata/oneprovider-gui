import $ from 'jquery';
import { expect } from 'chai';
import { click } from 'ember-native-dom-helpers';
import sleep from 'onedata-gui-common/utils/sleep';
import wait from 'ember-test-helpers/wait';

export function getFileRow({ entityId, name }) {
  let $row;
  if (entityId) {
    $row = $(`.fb-table-row[data-row-id="${entityId}"]`);
  } else {
    $row = $(`.fb-table-row:contains("${name}")`);
  }
  expect($row).to.have.length(1);
  return $row;
}

export async function doubleClickFile(file) {
  const row = getFileRow(file)[0];
  click(row);
  await sleep(1);
  await click(row);
}

export async function openFileContextMenu(file) {
  const $row = getFileRow(file);
  $row[0].dispatchEvent(new Event('contextmenu'));
  await wait();
  const $fileActions = $('.file-actions');
  expect($fileActions, 'file-actions').to.have.length(1);
  return $fileActions;
}

export async function chooseFileContextMenuAction(file, actionId) {
  const $fileActions = await openFileContextMenu(file);
  const action = $fileActions.find(`.file-action-${actionId}`)[0];
  expect(action, `action item ${actionId}`).to.exist;
  await click(action);
}
