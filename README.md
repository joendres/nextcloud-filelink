<!--
Copyright (C) 2020 Johannes Endres

SPDX-License-Identifier: MIT
-->

# *cloud - Filelink for Nextcloud OpenCloud ownCloud

A MailExtension for Thunderbird (115+) that uploads large attachments to your
cloud and generates a link you can send by mail instead of the file.

## What You'll Need (Requirements)

1. Thunderbird 115.0 or newer
2. An account on a server running [Nextcloud](https://nextcloud.com/), [OpenCloud](https://opencloud.eu/) or [ownCloud](https://owncloud.com/):

   * Nextcloud version 32 or newer (older versions might work, but are [not supported by
Nextcloud](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule))
   * OpenCloud version 4.0 or newer (older versions might work, but have not
been tested).
   * ownCloud Classic version 10.0.10 or newer.
   * ownCloud Infinite Scale (oCIS) version 5 or newer (older versions might
work, but are [not supported by
ownCloud](https://owncloud.dev/ocis/release_roadmap/))\
_Caution:_ You will need some help from your administrator as oCIS does
not support __*cloud__ by default.

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

1. In Thunderbird click "Preferences", then "Compose" and then "Attachments".
2. Click the button "Add *cloud".
3. Only three settings are strictly necessary:

* Server-URL
* Username
* App Token (or password)

### How to get an App Token for Nextcloud or ownCloud Classic

1. Open your Nextcloud or ownCloud Classic account in your browser
2. Go to Settings -> Security -> App Token
3. At the bottom of the page generate a new token.
4. Copy&paste it into the "App Token" field of the __*cloud__ preferences page
in Thunderbird.
5. Also copy the _username_ into the  __*cloud__ preferences page
in Thunderbird. It might differ from your login username.

### How to get an App Token for OpenCloud

1. Open your OpenCloud account in your browser.
2. Go to Preferences -> App Tokens
3. Click the "+ New" button
4. Put a name into the "Note" field (for example "*cloud") and choose an
expiration date for the App Token
5. Copy the App Token from the next dialog and paste it into the "App Token"
field of the __*cloud__ preferences page in Thunderbird.

### How to get an App Token for ownCloud Infinite Scale (oCIS)

1. Open your oCIS account in the browser
1. Click on the "Application Switcher" in top left corner, left of the
ownCloud logo
1. Choose "App Tokens"

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

## FAQ

### I installed the Add-on, but it doesn't have an options page. How do I configure it?

__Solution:__  You'll find the configuration in Thunderbird's Preferences, see
[Configure](#configure) above.

### Uploads fail and the *cloud status says "Sharing failed", but I can still find the files in my cloud. What can I do?

There are three possible causes:

#### Nextcloud's sharing limit

By default, Nextcloud allows a user to create at most 20 share links within
any 10-minute interval. If you send emails with many attachments in a short
time, this limit may be reached. Ask your cloud administrator to raise the
limit.

__Solution:__ A [section in the cloud admin
documentation](ADMIN.md#rate-limit-on-sharing) explains how to change the
limit.

#### Invalid download password

The _download_ password has to comply with _all_ the rules for passwords on
your cloud, otherwise the _upload_ will fail. Nextcloud, OpenCloud and
ownCloud all have default password rules, and your admin might have configured
additional ones.

__Solution:__ Choose a more complicated password or activate the "Use
generated passwords" option.

#### Server misconfiguration

Sharing problems may also be caused by a misconfiguration of the cloud server.

__Solution:__ Point your cloud admin to the section on [Apache and
mod_rewrite](ADMIN.md#mod_rewrite) in the cloud admin documentation.

### Why is the icon for the cloud service not showing up in my message?

When you add a link to a message the icon of the cloud service should appear
in the draft next to the service name. Starting with version 135 Thunderbird
doesn't display the icon here. That's a [bug in
Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=2057816).

The icon will still appear for the recipient of the message.

### Could you please change the style of the text that is inserted into the message / add _X_ / remove _Y_?

Sorry, but I can't.

Add-ons like __*cloud__ have no chance to do that, because the template text
surrounding the URL is part of Thunderbird. The Add-on only supplies the URL,
Thunderbird wraps its template around it and inserts the whole thing into your
message.

### Could you at least add the download password to the message?

Short answer: No, I don't want to do that.

Background: If you use download passwords, don't put them into an email, but
give them to the recipient via a separate, secure channel e.g. a messenger or
a telephone call.

Why? As a security measure the generated download links contain a long, almost
random part. This means an attacker (let's call her Eve) can't guess the link
for a file or scan all possible links to find a file. The only reasonable way
for Eve to gain access to your file is to intercept the email. The links are
therefore fairly secure by themselves and quite comfortable for the recipient,
because she only has to click the link.

A download password in the same email therefore doesn't make the transfer more
secure, but only more complicated for the recipient. The same goes for a
separate email with the password: If Eve can intercept the first email with
the link, she is probably also able to intercept the second email.

### I shared files with the same name from different folders, but only one file is uploaded and all links point to this file. What's wrong?

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

__Solution:__ At the moment you can only change the file names or set
different modification times (use the `touch` command on Unix systems).

### The URL I use to access my cloud account does not work when I type it into the *cloud configuration. What can I do?

There are two possible causes:

#### Redirect

Your cloud administrator might have configured a simple URL that redirects your browser to the actual URL of the cloud. __*cloud__ can't follow this redirect automatically.

__Solution:__

1. Log into your cloud account in the browser.
2. Copy the URL _after login_
3. Paste it into the __*cloud__ configuration in Thunderbird.

#### HTTPS certificate

If the admin of your cloud used something called a "self signed certificate",
Thunderbird (not __*cloud__) refuses to connect to the server.

__Solution 1 (preferred):__ Tell your admin about the problem. She might [install
another type of certificate](ADMIN.md#self-signed-certificates), which
Thunderbird accepts.

__Solution 2 (if Solution 1 is not possible):__ Force Thunderbird to accept
the certificate:

1. Open Thunderbird's preferences
2. Go to "Privacy & Security"
3. Scroll down to "Certificates"
4. Click on "Manage Certificates"
5. Choose "Servers"
6. Click on "Add Exception"
7. Enter your cloud's address in the "Location" field
8. Click "Get Certificate"
9. Click "Confirm Security Exception"

### Still not working?

If things still don't work, I'd appreciate a problem report by
[email](mailto:cloud@johannes-endres.de). Thanks.

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
* Based on [Filelink Provider for
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
