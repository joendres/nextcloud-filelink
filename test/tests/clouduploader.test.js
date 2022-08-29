import { CloudUploader } from "../../src/background/clouduploader.js";
const expect = chai.expect;

describe("CloudUploader", () => {
    /** @todo Add tests */
    describe('uploadFile', () => {
        it("is not a static method");
        it("is an async method");
        it("adds a new item to Status");
        it("sets that status to uploading");
        it("uses a DavUploader to upload the file");
        it("sets aborted to true in the return object if the upload was aborted");
        it("falls Status.fail if the upload fails");
        it("throws an Error with message 'Upload failed.' if the upload fails");
        it("sets Status.SHARING if the upload was ok");
        it("calls getShareLink and cleanUrl on the returned url");
        it("calls Status.done if the url is OK");
        it("sets the url and aborted:false in the return object if the url is OK");
        it("falls Status.fail if the url is not OK");
        it("throws an Error with message 'Upload failed.' if the url is not OK");
    });
    describe('generateDownloadPassword', () => {
        it("is not a static method");
        it("is an async method");
        it("gets a generated password from CloudAPI");
        it("returns that password");
        it("uses PasswordGenerator if CloudAPI returns falsy");
        it("returns that password");
    });
    describe('getShareLink', () => {
        it("is not a static method");
        it("is an async method");
        it("encodes the path");
        it("calls findExistingShare if no download password is required");
        it("doesn't call findExistingShare if one download password is configured");
        it("doesn't call findExistingShare if generated passwords are configured");
        it("returns an existing share url");
        it("creates a new share link if there is no matching one");
        it("returns that share link");
    });
    describe('findExistingShare', () => {
        it("is not a static method");
        it("is an async method");
        it("gets all shares for the file");
        it("returns null if there are none");
        it("returns null if it cannot search in the return value");
        it("returns null if there is no public share");
        it("returns null if a pasword is set on every share");
        it("returns null if a share_with is set on every share");
        it("returns null if useExpiry is not set but expiry is set on the shares");
        it("returns null if useExpiry is set but no expiry is set on the shares");
        it("returns null if useExpiry is set but no matching expiry is set on a share");
        it("returns the url if useExpiry is not set and no expiry is set on a share");
        it("returns the url if useExpiry is set and expiry is the same on a share");
    });
    describe('makeNewShare', () => {
        it("is not a static method");
        it("is an async method");
        it("calls generateDownloadPassword if useGeneratedDlPassword is true");
        it("sets the generated password status if useGeneratedDlPassword is true");
        it("stores the generated password in Status if useGeneratedDlPassword is true");
        it("doesn't call generateDownloadPassword if useGeneratedDlPassword is false");
        it("doesn't set the generated password status if useGeneratedDlPassword is false");
        it("doesn't call generateDownloadPassword if useGeneratedDlPassword is not set");
        it("doesn't set the generated password status if useGeneratedDlPassword is note set");
        it("gets an url from CloudAPI");
        it("returns the url");
        it("returns null if the CloudAPI does");
        it("doesn't set the generated password status if CloudAPI fails");
    });
    describe('cleanUrl', () => {
        it("is not a static method");
        it("is not an async method");
        it("returns null if the url is malformed");
        it("returns null if the protocol is neither http nor https");
        it("replaces a punycode hostname with the Unicode string");
        it("encodes the pathname with Utils.encodepath");
        it("appends /download if that is configured in the account");
        it("appends /download if there is no configuration in the account");
        it("does not append /download if that not configured in the account");
    });
});
