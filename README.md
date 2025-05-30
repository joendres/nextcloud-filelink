<!--
Copyright (C) 2020 Johannes Endres

SPDX-License-Identifier: MIT
-->

# __*cloud__ - FileLink for Nextcloud and ownCloud

[Deutsche Dokumentation](de/README.de.md)

A MailExtension for Thunderbird (68+) that uploads large attachments to your
Cloud and generates a link you can send by mail instead of the file.

[[_TOC_]]

## Requirements

* Thunderbird: 68.2.1 or newer
* An account on a server running a supported version of Nextcloud or ownCloud,
  more specifically:
  * [Nextcloud](https://nextcloud.com/) version 30 or newer (older versions
    might work, but are [not supported by
    Nextcloud](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule))
  * [ownCloud](https://owncloud.com/) version 10.0.10+ (10.0.9 and older
    versions contain bugs that prevent __*cloud__ from working).
  * [ownCloud Infinite Scale](https://owncloud.com/infinite-scale/) version 5 or newer (older versions
    might work, but are [not supported by
    ownCloud](https://owncloud.dev/ocis/release_roadmap/))

  If you can't or don't want to run your own server, there are many offers for
  [hosted Nextcloud](https://nextcloud.com/providers/) and [hosted ownCloud](https://owncloud.com/partners/find-a-partner/?_sft_partner-type=service-provider) services.

## User guide

### Installation

1. Go to Preferences -> Compose -> Attachments
2. Click the link "Find more providers..." at the bottom of the page.
3. Find __*cloud__ in the list and click the "Add to Thunderbird" button.
4. On the "Options" tab click the button "Add *cloud".
5. Configure. Only three settings are strictly necessary:
   * Server URL
   * Username
   * App token or password

__*cloud__ is also available via Thunderbird's Add-on
repository:

[![Get the Addon](https://gitlab.com/joendres/filelink-nextcloud/-/blob/master/public/get-the-addon.svg)](https://addons.thunderbird.net/thunderbird/addon/filelink-nextcloud-owncloud/)

### Usage

After you have configured at least one Nextcloud or ownCloud server there are
three ways to start the upload:

1. Add an attachment that is larger than the upload threshold. Thunderbird will
   then show a yellow notification bar at the bottom of the message window with
   a "Link" button. To get this button for smaller attachments you can change
   the threshold: Go to Preferences -> Compose -> Attachments and change the
   value "Offer to share...".
1. In the message window in the attachments menu (downward arrow in the "Attach"
   button), there is an entry "Filelink". It lets you choose a file and uploads
   it immediately.
1. After you added an attachment you can choose "Convert to..." from that
   attachments context menu (right click on the attachment).

### Known issues

#### Incorrect links for almost identical files

If you share a file that has

* the same name _and_
* identical size _and_
* identical modification time (to the second)

as a file that has been shared before, __*cloud__ considers this to be the same file and does not upload it again. Instead, __*cloud__ creates a share link to the first file.

If you've got files that are the same in these three ways but have different content, this can lead to the wrong file being shared. This could happen, for example, if you use a program that generates several files in different folders quickly.

At the moment, the only thing you can do is change the file names or set different modification times (use the 'touch' command on Unix systems).

#### Filenames with Unicode special character cause problems

In some minor versions of Thunderbird 102.2 filenames with specials characters
or in non-US script systems like Greek case problems. The upload works, but
sharing the uploaded file fails. This is fixed in Thunderbird 102.5.0; please
update Thunderbird.

#### You don't like the text/HTML/links inserted into the message

Many users would like to change the text that is inserted into the message along
with the download url, eg add the expiration date, change the cloud service
link, remove some of the text or style the HTML less prominently. Addons like
__*cloud__ have no chance to do that, because the template text surrounding the
url is part of Thunderbird. The Addon only supplies the url, Thunderbird wraps
its template around it and inserts the whole thing into your message (technical
details
[here](https://gitlab.com/joendres/filelink-nextcloud/-/issues/238#note_383881835)
and
[here](https://webextension-api.thunderbird.net/en/stable/cloudFile.html#onfileupload)).

#### Files from network shares uploaded to cloud _and_ attached

There was a [bug in
Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=793118): If you
attached a file from a network share, it was uploaded to the cloud and the share
link was inserted into your mail, but the file was _also attached to the
message_. This was fixed in Thunderbird 68.11.0 and 78.0.1. If you're still
experiencing this issue, update Thunderbird.

#### URL works in browser but not in *cloud

In some situations the url you use to access your Nextcloud/ownCloud account in
the browser doesn't work as the server URL in __*cloud__.

##### Reason 1: Redirect

If your access url is redirected to the actual cloud location (plus some
technicality), __*cloud__ can't find the actual url.

If this happens to you, point __*cloud__  to the actual cloud location:

1. Open your cloud in a browser.
1. Log in.
1. Depending on your cloud version you now have different views:
   * In Nextcloud 20 and newer you see the "Dashboard", just continue to the next step.
   * In older versions of Nextcloud and in ownCloud your see the "Files" app.
     Continue to the next step.
   * If you are neither in the "Dashboard" nor the "Files" app, click on the
     folder icon in the cloud's top menu to go to the "Files" app.
1. Copy the complete url from the url bar of your browser
1. Paste it into the server url field in __*cloud__'s configuration (in Thunderbird).

As soon as you save the settings, __*cloud__ will remove unnecessary parts.

##### Reason 2: https certificate

If the admin of your cloud used something called a "self signed certificate",
Thunderbird (not __*cloud__) refuses to connect to the server. There are two
solutions:

1. (preferred) Tell your admin about the problem. She might [install another type
   of certificate](#self-signed-certificates), which Thunderbird accepts.
1. (if 1. is not possible) Force Thunderbird to accept the certificate:
   1. Open Thunderbird's preferences
   1. Go to "Privacy & Security"
   1. Scroll down to "Certificates"
   1. Click on "Manage Certificates"
   1. Choose "Servers"
   1. Click on "Add Exception"
   1. Enter your cloud's address in the "Location" field
   1. Click "Get Certificate"
   1. Click "Confirm Security Exception"

#### Upload problems

The _download_ password has to comply with _all_ the rules for passwords on
your cloud, otherwise the _upload_ will fail. There are default rules of
Nextcloud and ownCloud, and your admin might have configured some different
rules.

#### Files are uploaded correctly but sharing fails

This is usually caused by a misconfiguration of the cloud server. Please point
your cloud admin to the section on [Apache and
mod_rewrite](#apache-and-mod_rewrite) below.

#### Still not working?

If things still don't work, I'd appreciate a problem report by
[email](mailto:cloud@johannes-endres.de). Thanks.

### Good to know

#### Download passwords

If you use download passwords, don't put them into an email, but give them
to the recipient via a separate, secure channel eg a messenger or a telephone
call.

Why? As a security measure the generated download links contain a long, almost
random part. So an attacker (let's call her Eve) can't guess the link for a file
or scan all possible links to find a file. The only reasonable way for Eve to
gain access to your file is to intercept the email. (If you are interested in
technical details, read this
[posting](https://gitlab.com/joendres/filelink-nextcloud/-/issues/221#note_367524670)).

So the links are fairly secure by themselves and quite comfortable for the
recipient, because she only has to click the link.

If you use download passwords, never put them into the same email as the link.
Because if Eve can read the link, she can also read the password. So a download
password in the same email doesn't make the transfer more secure, but only more
complicated for the recipient. The same goes for a separate email with the
password: If Eve can intercept the first email with the link, she is very
probably also able to intercept the second email.

#### Password vs. App Token

Instead of storing your password it's more secure to use an "App Token" with
__*cloud__. There are two ways to get such a token:

* _If you are using Nextcloud or ownCloud:_ Open your account in the browser and
  go to Settings -> Security -> App Token and at the bottom of the page generate
  a new token. Copy&paste it into the "App token" field of the Attachments
  preferences page in Thunderbird.

* _Only if you are using Nextcloud:_ Type your user password into the
  Attachments/Outgoing preferences page in Thunderbird. Upon saving, the Add-On will
  _try_ to get a token from your Nextcloud and use it instead of your password.
  You will notice the change, because afterwards the password field is filled
  with dots completely (app tokens are quite long).\

#### Handling of existing files

If you attach a file that's already in the attachments folder in your cloud
_with identical contents_, that file is not uploaded again. Instead the
existing file is shared.

To make this possible, __*cloud__ never deletes files in your cloud. Over time
your attachments folder may grow to considerable size. It's safe to delete old
attachments. Your admin may automate that, using "Flows" in Nextcloud or ownCloud.

You can use this behavior if you want to share large (or many) files: Sync your
attachments folder to a folder on your computer using the desktop client. If
you then attach a synced file from your computer to a message, __*cloud__ will
notice that it's already uploaded.

If you attach a file with the same name but different contents as a cloud
file, the cloud file will not be overwritten. Instead __*cloud__ moves the
existing file to a subfolder of the attachments folder; the original share
link will remain valid and point to the old content.\
Then the new file is uploaded and shared with a new share link.

__*cloud__ uses a similar method as the
Nextcloud/ownCloud desktop clients to decide if the local and remote files are
identical:

* identical name and
* identical size (in bytes) and
* last modification within the same second.

## Information for cloud administrators

### Server settings

Some settings in Nextcloud/ownCloud are relevant for this Add-On:

* __Settings -> Sharing -> Allow apps to use the Share API__ has to be enabled
* __Settings -> Sharing -> Allow users to share via link__ has to be enabled
* __The app "Share Files" has to be active.__ In ownCloud the Apps management is
  part of the administrator's settings, in Nextcloud it's accessible directly
  from the admin's profile menu.

### Redirects

In some configurations a start url like `https://cloud.example.com` is
redirected to the actual url of the cloud eg `https://example.com/cloud`.
__*cloud__ has to access many different paths below this url, eg. `status.php`.
If these are not also redirected (`https://cloud.example.com/status.php` ->
`https://example.com/cloud/status.php`), __*cloud__ can't access them and
doesn't work. There is no way for the extension to find the actual base url with
some certainty.

There is a [workaround](#url-works-in-browser-but-not-in-cloud): Users can find
out the actual url and configure it in __*cloud__.
But it's easier for users if all urls are redirected. So it would be
greatly appreciated if you would do that in your cloud instance (if you have to
use redirects at all). Thanks.

### Self-signed certificates

By default Thunderbird (not __*cloud__) refuses https connections using
self-signed certificates. It's a lot easier for your users, if you install a
[Let's encrypt](https://letsencrypt.org/getting-started/) certificate. There are
great How-tos on their site.

### Apache and mod_rewrite

[Nextcloud](https://docs.nextcloud.com/server/latest/admin_manual/installation/source_installation.html#additional-apache-configurations)
and[ownCloud](https://doc.owncloud.com/server/next/admin_manual/installation/manual_installation/manual_installation_apache.html#additional-apache-configurations)
both require mod_rewrite to be active if run in the Apache http server. Without
mod_rewrite __*cloud__ fails with different error scenarios depending on other
details of the configuration.

### Basic Auth

Currently __*cloud__ only supports HTTP Basic Auth. In ownCloud Infinite Scale (oCIS) Basic Auth is disabled by default and [has to be enabled](https://doc.owncloud.com/ocis/next/deployment/services/s-list/auth-basic.html).

## Contributions

* [Johannes Endres](@joendres), initial implementation, maintainer
* [Josep Manel Mendoza](@josepmanel), Catalan and Spanish localizations
* [Gorom](@Go-rom), French localization
* [Jun Futagawa](@jfut), implementation of generated random passwords
* [Lionel Elie Mamane](@lmamane), solution of the LDAP/getapppassword problem
* [Óvári](@ovari1), Hungarian localization
* [Pietro Federico Sacchi](https://crowdin.com/profile/sacchi.pietro), Italian localization
* [Asier Iturralde Sarasola](@aldatsa), Basque localization
* [Anatolii Balbutckii](@abalbuc), Russian localization
* Aleš Petržík, Czech localization
* [mixneko](@mixneko), traditional Chinese localization
* Based on [FileLink Provider for
  Dropbox](https://github.com/darktrojan/dropbox) by [Geoff
  Lankow](https://darktrojan.github.io/)
* Inspired by [Nextcloud for
  Filelink](https://github.com/nextcloud/nextcloud-filelink) by [Olivier
  Paroz](https://github.com/oparoz) and [Guillaume
  Viguier-Just](https://github.com/guillaumev).
* Thanks to [@JasonBayton](https://bayton.org/about/) for his [Nextcloud demo
  servers](https://bayton.org/2017/02/introducing-nextcloud-demo-servers/) of
  many (old) versions, that helped in the initial testing a lot.
* Contains [punycode.js](https://github.com/mathiasbynens/punycode.js), Copyright
  Mathias Bynens, [MIT
  license](https://github.com/mathiasbynens/punycode.js/blob/master/LICENSE-MIT.txt)
* Contains [photon-components-web](https://firefoxux.github.io/photon-components-web/)

If you'd like to contribute, see [CONTRIBUTING](CONTRIBUTING.md)
