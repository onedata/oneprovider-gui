# Release notes for project oneprovider-gui


CHANGELOG
---------

### Latest changes

* VFS-9665 Moved directory size statistics configuration to Onezone
* VFS-9655 Fixed showing size in scale for file in data distribution
* VFS-9422 Added data distribution for directories
* VFS-9335 Added charts dashboards to workflow GUI
* VFS-8716 Introduced new data specs editor to the automation gui
* VFS-9316 Removed usages of EmberPowerSelectHelper
* VFS-9394 Removed ember-browser-info
* VFS-9419 Added locking directory statistics toggle when accounting is enabled
* VFS-9508 Updated EmberJS to v3.4.8
* VFS-9567 Fixed opening background-click context menu in archives and datasets browsers
* VFS-8045 Added QoS audit log
* VFS-9499 Fixed too many rerendering cycles of the transfer menu
* VFS-9501 Fixed broken directory size charts in archive browser
* VFS-9502 Fixed hanging spinner after reloading empty directory
* VFS-9202 Added byte size of file in file details modal
* VFS-9439 Added subgroups to charts, added showing remote providers in directory size statistics
* VFS-9235 Added "jump to file by prefix" feature
* VFS-9355 Added more possible units to time series charts
* VFS-9233 Changed naming of "Purge archive" to "Delete"
* VFS-9163 Added config for space with directory size statistics setting
* VFS-9393 Fixed ordering of stacked chart series
* VFS-9411 Fixed empty points at the beginning of non-live chart time series
* VFS-9205 Using new file listing API
* VFS-9121 Added statistics for disk usage in directories
* VFS-8914 Redesigned datasets panel for file
* VFS-9397 Better presentation of time series measurements in automation store browser
* VFS-9332 Added handling time series measurements in all types of stores
* VFS-9021 Added recall process error log
* VFS-9270 Added task time series store
* VFS-9354 Fixed loading echarts library
* VFS-9029 Changed showing rest api for shares
* VFS-9360 Fixed creating incremental archive using always latest archive despite of user select
* VFS-9036 Added time series features to automation GUI
* VFS-9207 Removed usage of local OpenSans fonts
* VFS-9028 Added archive properties modal with description editor, improved archive description presentation
* VFS-9023 Added support for archive recall cancelling and recall information on non-recalling providers
* VFS-9138 Fixed glitch during info icon animation
* VFS-9102 Archives support Service Pack 22.03
* VFS-9034 Added support for new range data type and changed API of browsing automation stores
* VFS-9088 Fixed considering nested archives symlinks and BagIt files as external symlinks
* VFS-8598 Added feature tags for indicating files inside building and failed archives
* VFS-9013 QoS time series charts Service Pack 1
* VFS-9030 Added animated info icon for files and directories
* VFS-8654 Added support for symlinks in archives that points to external files and directories
* VFS-7631 Added file path to dataset item in datasets modal
* VFS-7717 Upgraded Babel to version 7.3, using EcmaScript 2019 for development
* VFS-8997 Added support for new data specs format in automation stores
* VFS-8794 Added transfer charts to QoS requirements
* VFS-7451 Fixed non-rounded corners in textarea in file info modal
* VFS-7731 Showing error after delete share failed
* VFS-8841 Added archive recall info modal and progress bar in tag
* VFS-8792 Added support for recalling archives
* VFS-8640 Added modal with OpenFaaS pods activity to workflow execution preview
* VFS-8874 Removed bower and ember-spin-button
* VFS-8887 Fixed not working file information modal in shares file browser
* VFS-6397 Removed redundant bower dependencies
* VFS-8723 Splitted datasets-archives view Service Pack 1: fixed graphical/UX glitches
* VFS-8799 Fixed browsing directories in nested archives
* VFS-8783 Fixed not listing files of nested archive
* VFS-8617 Removed usages of ember-invoke-action
* VFS-8739 Fixed double-listing datasets whose names have number suffixes
* VFS-8574 Updated backend errors translations
* VFS-7724 Changed separate dataset and archives views into splitted browser
* VFS-8698 Fixed ESLint warnings
* VFS-8755 Fixed randomly failing tests
* VFS-8639 Removed iterator strategy from workflows
* VFS-8255 Added workflows and lambdas revisions
* VFS-8561 Added support for "verifying" and "verification_failed" archive state
* VFS-8287 Added manual reruns and retries of a workflow lane run
* VFS-8653 Added "follow symlinks" option when creating archive
* VFS-8604 Fixed auto update of share name in breadcrumbs after rename
* VFS-8518 Unlocked possibility to create a hardlink for symlink
* VFS-8514 Added support for entering directories and downloading single file using "Enter" key on keyboard
* VFS-8348 Added links to files in transfers view with support for files inside archives
* VFS-7898 Added self-shortening links to files with support for files inside archives
* VFS-8283 Added showing multiple runs of workflow lanes
* VFS-8547 Fixed minor bugs: reloading datatasets root, opening file info modal in share and opening hardlinks info tab
* VFS-8482 Added dedicated page for privacy policy content
* VFS-7512 Added current directory QoS/Dataset tags in file browser header and collapsing inherited tags in file rows
* VFS-8360 Fixed compatibility between Onezone GUI 21.02 and Oneprovider GUI 20.02 by moving shared properties caching to Oneprovider GUI
* VFS-8038 Refactored build process to support faster builds on CI
* VFS-8346 Disabled reattach action for detached datasets with deleted root file
* VFS-8405 Added support for QoS requirements defined in hardlinks that were deleted
* VFS-8233 Fixed unnecessary error message when removing detached dataset which source file was deleted
* VFS-8452 Fixed showing correct error page when shared file has been deleted
* VFS-7629 Added new datasets panel with archives browser in file browser
* VFS-8379 Added auto-redirect to archives view after archive create
* VFS-7210 Added showing error when root dir not existed in public scope
* VFS-7112 Added warning when shared file has 0 perms for other
* VFS-8288 Fixed workflow executions list reloading, updated gui commons
* VFS-7633 Added links between file browser and datasets/archives browser with "blink" animation; infinite scroll bugfixing
* VFS-8053 Added ID copiers to places related to workflows
* VFS-7960 Fixed changing space in file browser during files upload
* VFS-7730 Added reloading files list after qos/metadata/acl change of file with hardlinks
* VFS-7371 Added showing progress for copied or moved operation
* VFS-8031 Added select current directory button in items selector (if applicable)
* VFS-8212 Fixed not working current directory rename
* VFS-7930 Added "create incremental archive" in archive context menu
* VFS-7896 Added workflow and task execution audit log preview
* VFS-8102 Optimized notifying about upload progress to Onezone GUI
* VFS-8086 Jumping to workflow execution details after execution start
* VFS-7947 Added running workflow from file browser
* VFS-8005 Fixed non-rendering shares browser after adding files selector upload; blocking upload to data-protected directory in selector
* VFS-7846 Added BagIt uploader button to file browser
* VFS-7975 Added cancellation of workflow executions
* VFS-7856 Added ability to upload files and create directories in files selector
* VFS-7855 Improved UX of workflow stores content listing
* VFS-7950 Showing store used by workflow lane
* VFS-7951 Added support for following symlinks on download
* VFS-7893 Added support for DIP archives
* VFS-7875 Added support for incremental archives
* VFS-7880 Added showing errors in stores content listing
* VFS-7836 Added workflow stores content listing
* VFS-7817 Workflows GUI Service Pack 1
* VFS-7870 Fixed invalid shares breadcrumbs
* VFS-7796 Added support for BagIt archives and navigating through symlinked directories
* VFS-7830 Fixed wrong (info) modal opening on file tags: protection, metadata, qos, permissions
* VFS-7329 Added automation (workflows) view
* VFS-7821 Fixed no action on file/datasets tags clicking
* VFS-7802 Changed inside-browser selectors to be compatible with legacy browsers
* VFS-7743 Added embeddable files/datasets selector component
* VFS-7738 Fixed issues with archives browser navigation
* VFS-7649 Added purge archive action to archives browser
* VFS-7705 Added additional file actions to archive file browser
* VFS-7712 Showing archived files counters for more states
* VFS-7473 Added datasets and archives browser
* VFS-7639 Changed .tar.gz to .tar in download actions
* VFS-7576 Added XRootD shell commands to file info
* VFS-5690 Added opening cluster invalid cert link in new tab and countdown for retry
* VFS-7326 Changed counter in files remove modal
* VFS-7467 Fixed spinners when preparing file download and error messages
* VFS-7419 Added support for hard links and (still experimental) symbolic links
* VFS-7504 Added directory download REST API to info of shared directories
* VFS-7401 Added support for datasets and write protection in file browser
* VFS-7368 Added support for compressed directory and multiple files download
* VFS-7427 Changed copiable REST URLs into curl commands
* VFS-7293 Added copyable REST URLs for shares and shared files, shares UX improvements
* VFS-7385 Removed op_replica occurrences
* VFS-6842 Fixed JS console errors while scrolling file transfers list
* VFS-7349 Fixed share root dir view crash after adding isLast flag support
* VFS-7316 Added ANONYMOUS special ACE subject
* VFS-7194 Added support for isLast flag when fetching directory files data
* VFS-7271 Fixed showing shared space root dir name
* VFS-6566 Improved UX and refactored share views
* VFS-7009 Do not display "no access" file tag if user is space owner
* VFS-7202 Updated "bad data" backend error translation
* VFS-6802 Added graphical QoS expression editor
* VFS-7042 Updated common libs
* VFS-7058 Added a detached shares cleanup during files deletion using GUI
* VFS-6745 Updated common libs
* VFS-7011 Fixed error when saving file permissions due to API changes
* VFS-6967 Fixed not visible JSON and RDF metadata editors in Safari
* VFS-6829 Handling Base64-encoded RDF metadata (if it was set using Python xattrs)
* VFS-6925 Fixed scrolling down file list on Firefox on HiDPI screens
* VFS-6851 Fixed a security issue in share GUI
* VFS-6747 Improved layout of statuses and actions in the data distribution modal
* VFS-6746 Added available QoS parameters suggestion box
* VFS-6732 New editor for metadata JSON and RDF
* VFS-6456 Handling lack of privileges for transfers actions
* VFS-6652 Enabled assets fingerprinting for more resources
* VFS-6570 Added spinner to file row when loading download file URL
* VFS-6720 Fixed random file list duplicates
* VFS-6704 Fixed file list refresh bugs after removing multiple files, reload and upload
* VFS-6640 Extended QoS expression API: support for spaces and dashes in key/values, changed complement operator, added math comparison operators
* VFS-6675 Fixed file browser crashing when first selected file cannot be loaded
* VFS-6657 Fixed files not showing up when uploading to empty directory or creating many directories
* VFS-6455 Added support for jumping to any place in infinite-scrolled files list using URL
* VFS-6664 Fixed cloned entries on file transfers list
* VFS-6612 Disable transfers if they are impossible because of readonly support
* VFS-6495 Fixed wrong computation of transfer indexes resulting wrong listing
* VFS-6540 Added custom chunk size for uploader based on optimal chunk size for a space
* VFS-6445 Fixed not updating file and global QoS modal status
* VFS-6443 Reverted Oneprovider GUI backend error notifications
* VFS-6346 Unified Oneprovider GUI Service Pack 4
* VFS-6344 Added support for impossible QoS requirement and lack of QoS privileges
* VFS-6358 Uploader optimization
* VFS-6381 Fixed build process
* VFS-6343 Updated common libs
* VFS-6323 Unified Oneprovider GUI Service Pack 3
* VFS-6324 Added support for multiple files in QoS modal
* VFS-5980 Unified Oneprovider GUI Service Pack 2
* VFS-6232 Added readonly views (eg. metadata) for file browser in preview mode
* VFS-6270 Fixed not showing shares after adding to new directory
* VFS-6205 Fixed not invoking current dir actions
* VFS-5899 Updated common libs
* VFS-6145 Added file QoS management
* VFS-5929 Changed file listing API to Readdir+
* VFS-6176 Fixed broken Oneprovider dropdown on global map
* VFS-6115 Service Pack 1 for embedded Oneprovider GUI
* VFS-5767 Added metadata modal
* VFS-5988 Added shares views and management
