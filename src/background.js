AccountUpdater.update_all();
TBVersionWorkarounds.apply_all();

browser.cloudFile.onFileUpload.addListener(EventHandlers.onFileUpload);
browser.cloudFile.onFileUploadAbort.addListener(EventHandlers.onFileUploadAbort);
browser.cloudFile.onFileDeleted.addListener(EventHandlers.onFileDeleted);
// browser.cloudFile.onAccountAdded.addListener( /* Nothing to do, don't add a handler*/
browser.cloudFile.onAccountDeleted.addListener(EventHandlers.onAccountDeleted);

/* Make jshint happy */
/* global AccountUpdater, EventHandlers, TBVersionWorkarounds */
