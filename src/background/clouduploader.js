import { DavUploader } from "../background/davuploader.js";
import { CloudAccount } from "../common/cloudaccount.js";
import { CloudAPI } from "../common/cloudapi.js";
import { Statuses } from "../common/statuses.js";
import { Utils } from "../common/utils.js";
import { PasswordGenerator } from "./passwordgenerator.js";
import { Status } from "./status.js";
import * as punycode from "../background/punycode.es6.js";

export class CloudUploader extends CloudAccount {
    /**
     * Upload a single file
     *
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} fileName w/o path
     * @param {File} fileObject the local file as a File object
     * @returns {Promise<{[aborted]:boolean,[url]:string}>} An url if upload and sharing succeeded, aborted if it was aborted
     * @throws {Error} if the upload fails
     */
    async uploadFile(uploadId, fileName, fileObject) {
        Status.add(uploadId, fileName);

        Status.set_status(uploadId, Statuses.PREPARING);

        const uploader = new DavUploader(
            this.serverUrl, this.username, this.password, this.userId, this.storageFolder,
            await this.updateFreeSpaceInfo());

        const response = await uploader.uploadFile(uploadId, fileName, fileObject);

        if (response.aborted) {
            return response;
        } else if (response.ok) {
            Status.set_status(uploadId, Statuses.SHARING);
            this.updateFreeSpaceInfo();
            let url = this.cleanUrl(await this.getShareLink(fileName, uploadId));
            if (url) {
                Status.done(uploadId);
                return { url, aborted: false, };
            }
        }

        Status.fail(uploadId);
        throw new Error("Upload failed.");
    }

    /**
     * Generate a download password using the NC web service if its present or a local generator otherwise
     * @returns {Promise<string>} A most probably valid password
     */
    async generateDownloadPassword() {
        /* If we generate a password locally, the generation via web service didn't work. In that case
        validation also doesn't work, so the locally generateed password cannot be validated. */
        return (await CloudAPI.getGeneratedPassword(this)) || PasswordGenerator.generate(16);
    }

    /**
     * Get a share link for the file, reusing an existing one with the same
     * parameters
     * @param {string} fileName The name of the file to share
     * @param {string} uploadId The id of the upload created in background.js
     * @returns {Promise<string>} The share link as returned by the OCS API
     */
    async getShareLink(fileName, uploadId) {
        const path_to_share = Utils.encodepath(this.storageFolder + "/" + fileName);
        /** @todo expiryDay seems to be empty here */
        const expireDate = this.useExpiry ? daysFromTodayIso(this.expiryDays) : null;

        //  Check if the file is already shared ...
        // It's not possible to retrieve and display the password for an existing share
        if (!this.oneDLPassword && !this.useGeneratedDlPassword) {
            const existingURL = await this.findExistingShare(path_to_share, expireDate);
            if (existingURL) {
                return existingURL;
            }
        }
        return this.makeNewShare(path_to_share, expireDate, uploadId);

        /**
         * Adds the given number of days to the current date and returns an ISO sting of
         * that date
         * @param {number} days Number of days to add
         */
        function daysFromTodayIso(days) {
            const d = new Date();
            d.setDate(d.getDate() + parseInt(days));
            return d.toISOString().slice(0, 10);
        }
    }

    /**
     * Check if the file is already shared with the same parameters
     * @param {string} path_to_share The encoded path of the file
     * @param {string} expireDate The expiry date, encoded as ISO
     * @returns {Promise<string?>} The existing share url or null
     */
    async findExistingShare(path_to_share, expireDate) {
        const shareinfo = await CloudAPI.getSharesForFile(this, path_to_share);

        if (!shareinfo || !shareinfo.find) {
            return null;
        }

        const existingShare = shareinfo.find(share =>
            // It's a public share ...
            (share.share_type === 3) &&
            /* If a password is set, share_with is not empty in both cloud
            flavors. Since we have no chance to retreive the share password, we
            use this to ignore shares with passwords. But Nextcloud might "fix"
            this, so we also check for password to make sure we are still fine
            if that happens.*/
            // ... and it has no password ...
            !share.share_with && !share.password &&
            // ... and the same expiration date
            (
                (!this.useExpiry && !share.expiration) ||
                (this.useExpiry && share.expiration && share.expiration.startsWith(expireDate))
            ));

        if (existingShare && existingShare.url) {
            return existingShare.url;
        }

        return null;
    }

    /**
     * Share the file
     * @param {string} path_to_share The encoded path of the file
     * @param {string} expireDate The expiry date, encoded as ISO
     * @param {string} uploadId The id of the upload created in background.js
     * @returns {Promise<string?>} The new share url or null on error
     */
    async makeNewShare(path_to_share, expireDate, uploadId) {
        if (this.useGeneratedDlPassword) {
            this.downloadPassword = await this.generateDownloadPassword();
        }

        const url = await CloudAPI.getNewShare(this, path_to_share, expireDate);

        if (url && this.useGeneratedDlPassword) {
            Status.set_password(uploadId, this.downloadPassword);
            Status.set_status(uploadId, Statuses.GENERATEDPASSWORD);
        }
        return url;
    }

    /**
     * - Remove all unwanted parts like username, parameters, ...
     * - Convert punycode domain names to UTF-8
     * - URIencode special characters in path
     * @param {string} url An URL that might contain illegal characters, Punycode and unwanted parameters
     * @returns {string?} The cleaned URL or null if url is not a valid http(s) URL
     */
    cleanUrl(url) {
        let u;
        try {
            u = new URL(url);
        } catch (_) {
            return null;
        }
        if (!u.protocol.match(/^https?:$/)) {
            return null;
        }
        let encoderUrl = u.origin.replace(u.hostname, punycode.toUnicode(u.hostname)) +
            /** @todo As URL() already encodes the path, does double encoding make sense? */
            Utils.encodepath(u.pathname);

        if (!this.noAutoDownload) {
            encoderUrl += (encoderUrl.endsWith("/") ? "" : "/") + "download";
        }
        return encoderUrl;
    }
}
