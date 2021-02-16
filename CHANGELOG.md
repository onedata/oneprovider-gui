# Release notes for project oneprovider-gui


CHANGELOG
---------

### Latest changes

* VFS-6842 Fixed JS console errors while scrolling file transfers list
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
