import { AccountUpdater } from "./accountupdater.js";
import { EventHandlers } from "./eventhandlers.js";
import { TBVersionWorkarounds } from "./tbversionworkarounds.js";

AccountUpdater.update_all();
TBVersionWorkarounds.apply_all();

messenger.cloudFile.onFileUpload.addListener(EventHandlers.onFileUpload);
messenger.cloudFile.onFileUploadAbort.addListener(EventHandlers.onFileUploadAbort);
messenger.cloudFile.onFileDeleted.addListener(EventHandlers.onFileDeleted);
messenger.cloudFile.onAccountAdded.addListener(EventHandlers.onAccountAdded);
messenger.cloudFile.onAccountDeleted.addListener(EventHandlers.onAccountDeleted);
