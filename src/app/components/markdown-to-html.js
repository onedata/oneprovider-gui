/**
 * This is a TEMPORARY alias for `one-markdown-to-html` for backward compatibility
 * of `onedata-gui-common`.
 * 
 * TODO: It will be removed in VFS-6566
 * 
 * @deprecated
 * @module components/markdown-to-html
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneMarkdownToHtml from 'oneprovider-gui/components/one-markdown-to-html';
import layout from 'oneprovider-gui/templates/components/one-markdown-to-html';

export default OneMarkdownToHtml.extend({
  layout,
});
