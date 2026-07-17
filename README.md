<!--
Copyright (C) 2020 Johannes Endres

SPDX-License-Identifier: MIT
-->

# __*cloud__ - FileLink for Nextcloud OpenCloud ownCloud

[Deutsche Dokumentation](de/README.de.md)

A MailExtension for Thunderbird (115+) that uploads large attachments to your
cloud and generates a link you can send by mail instead of the file.

[[_TOC_]]

[Information for cloud administrators](ADMIN.md)

## What You'll Need (Requirements)

1. Thunderbird 115.0 or newer
2. An account on a server running Nextcloud, OpenCloud or ownCloud:
   * [Nextcloud](https://nextcloud.com/) version 32 or newer (older versions
    might work, but are [not supported by
    Nextcloud](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule))
   * [OpenCloud](https://opencloud.eu/) version 3.5 or newer (older versions
    might work, but have not been tested).
   * [ownCloud Classic](https://owncloud.com/) version 10.0.10 or newer.
   * [ownCloud Infinite Scale](https://owncloud.com/infinite-scale/) (oCIS)
    version 5 or newer (older versions might work, but are [not supported by
    ownCloud](https://owncloud.dev/ocis/release_roadmap/))\
    _Caution:_ You will need some
    help from your administrator as oCIS does not support __*cloud__ by
    default.

   If you can't or don't want to run your own server, many companies offer to run it for you as a hosted service:
   * [List of Nextcloud providers](https://nextcloud.com/providers/)
   * [List of OpenCloud providers](https://opencloud.eu/en/about-us/partner)
   * [List of
  ownCloud providers](https://owncloud.com/partners/find-a-partner/?_sft_partner-type=service-provider)

## Install

1. Go to Preferences -> Compose -> Attachments
2. Click the link "Find more providers..." at the bottom of the page.
3. Find __*cloud__ in the list and click the "Add to Thunderbird" button.

## Configure

1. In thunderbird go to Preferences -> Compose -> Attachments
2. Click the button "Add *cloud".
3. Only three settings are strictly necessary:
    * Server-URL
    * Username
    * App Token (or password)

### Getting an App Token for Nextcloud or ownCloud Classic

1. Open your Nextcloud or ownCloud Classic account in the browser
2. Go to Settings -> Security -> App Token
3. At the bottom of the page generate a new token.
4. Copy&paste it into the "App Token" field of the __*cloud__ preferences page
  in Thunderbird.
5. Also copy the _username_ into the  __*cloud__ preferences page
  in Thunderbird. It might differ from your login username.

### Getting an App Token for OpenCloud

1. Open your OpenCloud account in the browser
2. Go to Preferences -> App Tokens
3. Click the "+ New" button
4. Put a name into the "Note" field (eg. "*cloud") and choose an expiration
   date for the App Token
5. Copy the App Token from the next dialog and paste it into the "App Token"
  field of the __*cloud__ preferences page in Thunderbird.

### Getting an App Token for ownCloud Infinite Scale (oCIS)

1. Open your oCIS account in the browser
1. Click on the "Application Switcher" in top left corner, left of the
   ownCloud logo
1. Choose "App Tokens"\
   _If this option is missing from the Applications menu, ask your cloud
   administrator to install the "App Tokens" app from the oCIS App Store._
1. Click the "Create" button
1. Copy the App Token in the next dialog and paste it into the "App Token"
  field of the __*cloud__ preferences page in Thunderbird.

### Automatic App Token for Nextcloud

With Nextcloud __*cloud__ will _try_ to obtain an App Token for you:

1. Put your user password into the "App Token" field of the __*cloud__
  preferences page in Thunderbird.
1. Click "Save". __*cloud__  will _try_ to get a token from your Nextcloud and
  use it instead of your password. You will notice the change, because
  afterwards the password field is filled with dots completely (app tokens are
  quite long).

## Use

After you have added at least one account there are
three ways to start the upload:

1. Add an attachment that is larger than the upload threshold. Thunderbird
   will then show a yellow notification bar at the bottom of the message
   window with a "Link" button. To get this button for smaller attachments you
   can change the threshold: Go to Preferences -> Compose -> Attachments and
   change the value "Offer to share...".
2. In the message window in the attachments menu (downward arrow in the
   "Attach" button), there is an entry "Filelink". It lets you choose a file
   and uploads it immediately.
3. After you added an attachment you can choose "Convert to..." from that
   attachments context menu (right click on the attachment).

## Known issues

### Files are uploaded correctly but sharing fails

#### Cause 1: Nextcloud's sharing limit

By default, Nextcloud allows a user to create at most 20 share links within
any 10-minute interval. If you send emails with many attachments in a short
time, this limit may be reached.

Solution: Ask your cloud administrator to raise the limit. A [section in the
cloud admin documentation](ADMIN.md#rate-limit-on-sharing) explains how to
change the limit.

#### Cause 2: Invalid download password

The _download_ password has to comply with _all_ the rules for passwords on
your cloud, otherwise the _upload_ will fail. There are default rules of
Nextcloud, OpenCloud and ownCloud, and your admin might have configured some different
rules.

#### Cause 3: Server misconfiguration

Sharing problems man also be caused by a misconfiguration of the cloud server. Please
point your cloud admin to the section on [Apache and
mod_rewrite](ADMIN.md#mod_rewrite) in the cloud admin documentation.

### Incorrect links for almost identical files

If you share a file that has

* the same name _and_
* identical size _and_
* identical modification time (to the second)

as a file that has been shared before, __*cloud__ considers this to be the
same file and does not upload it again. Instead, __*cloud__ creates a share
link to the first file.

If you've got files that are the same in these three ways but have different
content, this can lead to the wrong file being shared. This could happen, for
example, if you use a program that generates several files in different
folders quickly.

At the moment, the only solution is to change the file names or set different
modification times (use the `touch` command on Unix systems).

### You don't like the text/HTML/links inserted into the message

Many users would like to change the text that is inserted into the message
along with the download url, eg add the expiration date, change the cloud
service link, remove some of the text or style the HTML less prominently.
Addons like __*cloud__ have no chance to do that, because the template text
surrounding the url is part of Thunderbird. The Addon only supplies the url,
Thunderbird wraps its template around it and inserts the whole thing into your
message.

### URL works in browser but not in *cloud

In some situations the url you use to access your Nextcloud/OpenCloud/ownCloud account in
the browser doesn't work as the server URL in __*cloud__.

#### Cause 1: Redirect

If your access url is redirected to the actual cloud location (plus some
technicality), __*cloud__ can't find the actual url.

If this happens to you, point __*cloud__  to the actual cloud location:

1. Open your cloud in a browser.
1. Log in.
1. Depending on your cloud version you now have different views:
    * In Nextcloud you see the "Dashboard", just continue to the next step.
    * In Opencloud, ownCloud Classic and ownCloud Infinite Scale your see the "Files" app.
     Continue to the next step.
    * If you are neither in the "Dashboard" nor the "Files" app, click on the
     folder icon in the cloud's top menu to go to the "Files" app.
1. Copy the complete url from the url bar of your browser
1. Paste it into the server url field in __*cloud__'s configuration (in Thunderbird).

As soon as you save the settings, __*cloud__ will remove unnecessary parts.

#### Cause 2: https certificate

If the admin of your cloud used something called a "self signed certificate",
Thunderbird (not __*cloud__) refuses to connect to the server. There are two
solutions:

1. (preferred) Tell your admin about the problem. She might [install another type
   of certificate](ADMIN.md#self-signed-certificates), which Thunderbird accepts.
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

### Still not working?

If things still don't work, I'd appreciate a problem report by
[email](mailto:cloud@johannes-endres.de). Thanks.

## Good to know

### Download passwords

If you use download passwords, don't put them into an email, but give them to
the recipient via a separate, secure channel eg a messenger or a telephone
call.

Why? As a security measure the generated download links contain a long, almost
random part. So an attacker (let's call her Eve) can't guess the link for a
file or scan all possible links to find a file. The only reasonable way for
Eve to gain access to your file is to intercept the email. (If you are
interested in technical details, read this
[post](https://gitlab.com/joendres/filelink-nextcloud/-/issues/221#note_367524670)).

So the links are fairly secure by themselves and quite comfortable for the
recipient, because she only has to click the link.

If you use download passwords, never put them into the same email as the link.
Because if Eve can read the link, she can also read the password. So a
download password in the same email doesn't make the transfer more secure, but
only more complicated for the recipient. The same goes for a separate email
with the password: If Eve can intercept the first email with the link, she is
very probably also able to intercept the second email.

### Handling of existing files

If you attach a file that's already in the attachments folder in your cloud
_with identical contents_, that file is not uploaded again. Instead the
existing file is shared.

To make this possible, __*cloud__ never deletes files in your cloud. Over time
your attachments folder may grow to considerable size. It's safe to delete old
attachments. Your admin may automate that, using "Flows" in Nextcloud or
ownCloud Classic.

You can use this behavior if you want to share large (or many) files: Sync
your attachments folder to a folder on your computer using the desktop client.
If you then attach a synced file from your computer to a message, __*cloud__
will notice that it's already uploaded.

If you attach a file with the same name but different contents as a cloud
file, the cloud file will not be overwritten. Instead __*cloud__ moves the
existing file to a subfolder of the attachments folder; the original share
link will remain valid and point to the old content.\
Then the new file is uploaded and shared with a new share link.

__*cloud__ uses a similar method as the Nextcloud/OpenCloud/ownCloud desktop clients to
decide if the local and remote files are identical:

* identical name and
* identical size (in bytes) and
* last modification within the same second.

## Contributions

* [Johannes Endres](@joendres), initial implementation, maintainer
* [Josep Manel Mendoza](@josepmanel), Catalan and Spanish localizations
* [Gorom](@Go-rom), French localization
* [Jun Futagawa](@jfut), implementation of generated random passwords
* [Lionel Elie Mamane](@lmamane), solution of the LDAP/getapppassword problem
* [Óvári](@ovari1), Hungarian localization
* [Pietro Federico Sacchi](https://crowdin.com/profile/sacchi.pietro), Italian
  localization
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
* Contains [punycode.js](https://github.com/mathiasbynens/punycode.js),
  Copyright Mathias Bynens, [MIT
  license](https://github.com/mathiasbynens/punycode.js/blob/master/LICENSE-MIT.txt)
* Contains [photon-components-web](https://firefoxux.github.io/photon-components-web/)

