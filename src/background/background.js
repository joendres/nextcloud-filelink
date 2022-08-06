import { AccountUpdater } from "./accountupdater.js";
import { EventHandlers } from "./eventhandlers.js";
import { TBVersionWorkarounds } from "./tbversionworkarounds.js";
import { MessageDispatcher } from "./messagedispatcher.js";

AccountUpdater.update_all();
TBVersionWorkarounds.apply_all();

browser.cloudFile.onFileUpload.addListener(EventHandlers.onFileUpload);
browser.cloudFile.onFileUploadAbort.addListener(EventHandlers.onFileUploadAbort);
browser.cloudFile.onFileDeleted.addListener(EventHandlers.onFileDeleted);
browser.cloudFile.onAccountAdded.addListener(EventHandlers.onAccountAdded);
browser.cloudFile.onAccountDeleted.addListener(EventHandlers.onAccountDeleted);

MessageDispatcher.installHandler();
