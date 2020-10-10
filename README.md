# __*cloud__ - FileLink for Nextcloud and ownCloud

A MailExtension for Thunderbird (68+) that uploads large attachments to your
Cloud and generates a link you can send by mail instead of the file.

[[_TOC_]]

## Requirements

* Nextcloud: 17 or newer (older versions might work, but are [not supported by
  Nextcloud](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule))
* ownCloud: 10.0.10+ (10.0.9 and older versions contain bugs that prevent __*cloud__ from working).
* Thunderbird: 68.2.1 or newer (60.5+ might work, but has not been tested)

## User guide

### Installation

1. Go to Settings -> Attachments -> Outgoing
1. Click the link "Find more providers..." at the bottom of the page.
1. Find __*cloud__ in the list and click the "Add to Thunderbird" button.
1. On the "Options" tab click the button "Add *cloud".
1. Configure. Only three settings are strictly necessary:
   * Server URL
   * Username
   * App token or password

__*cloud__ is also available via Thunderbird's Add-on
repository:

[![Get the Addon](https://addons.cdn.mozilla.net/static/img/addons-buttons/TB-AMO-button_1.png)](https://addons.thunderbird.net/thunderbird/addon/filelink-nextcloud-owncloud/).

### Known issues

#### You don't like the text/HTML/links inserted into the message

Many users would like to change the text that is inserted into the message along
with the download url, eg add the expiration date, change the cloud service link, remove some of the text or style the HTML less prominently.
Addons like __*cloud__ have no chance to do that, because the template text surrounding the url is part of Thunderbird. The Addon only supplies the url, Thunderbird wraps its template around it and inserts the whole thing into your message (technical
details
[here](https://gitlab.com/joendres/filelink-nextcloud/-/issues/238#note_383881835)
and
[here](https://thunderbird-webextensions.readthedocs.io/en/68/cloudFile.html#onfileupload-account-fileinfo)).

There is a feature suggestion for Thunderbird, to [make this template editable](https://bugzilla.mozilla.org/show_bug.cgi?id=1643729). You might consider backing this suggestion with your vote or a helpful comment.

#### Files from network shares uploaded to cloud *and* attached

There was a [bug in
Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=793118): If you
attached a file from a network share, it was uploaded to the cloud and the share
link was inserted into your mail, but the file was *also attached to the
message*. This was fixed in Thunderbird 68.11.0 and 78.0.1. If you're still
experiencing this issue, update Thunderbird to a fixed version.

#### URL works in browser but not in *cloud

In some situations the url you use to access your Nextcloud/ownCloud account in
the browser doesn't work in __*cloud__. This happens if your access url is
redirected to the actual cloud location (plus some technicality).

If this happens to you, point __*cloud__  to the actual cloud location:

1. Open your cloud in your browser.
1. Log in. This should take you to the "Files" app within your cloud. If it
   doesn't, click on the folder icon to go to that app.
1. Copy the complete url from the url bar of your browser
1. Paste it into the server url field in __*cloud__'s configuration (in Thunderbird).

When you save the settings, __*cloud__ will remove unnecessary parts.

If this still doesn't work for you, read on:

Here is an example of what should happen:

* You paste ```https://cloud.example.com/index.php/apps/files/?dir=/&fileid=42```
* After saving the Server URL field contains ```https://cloud.example.com/```

If things look very different for you and login still doesn't work, I'd
appreciate a problem report by [email](mailto:cloud@johannes-endres.de)
containing the url you pasted. Don't be afraid, the url does not contain any
secret data. Thanks.

#### Upload problems

* The *download* password has to comply with *all* the rules for passwords on
  your cloud, otherwise the *upload* will fail. There are default rules of
  Nextcloud and ownCloud, and your admin might have configured some different
  rules.
* If the Add-On still fails, please check if it's a [known
  bug](https://gitlab.com/joendres/filelink-nextcloud/-/boards). Feel free to
  open a new issue otherwise.

### Good to know

#### Download passwords

**If you use download passwords, _never_ put them into an email, but give them
to the recipient via a separate, secure channel eg a messenger or a telefone
call.**

Why? As a security measure the generated download links contain a long, almost
random part. So an attacker (let's call her Eve) can't guess the link for a file
or scan all possible links to find a file. The only reasonable way for Eve to
gain access to your file is to intercept the mail. (If you are interested in
technical details, read this
[posting](https://gitlab.com/joendres/filelink-nextcloud/-/issues/221#note_367524670)).

So the links are fairly secure by themselves and quite comfortable for the
recipient, because she only has to click the link.

If you use download passwords, *never* put them into the same email as the link.
Because if Eve can read the link, she can also read the password. So a download
password in the same email doesn't make the transfer more secure, but only more
complicated for the recipient. The same goes for a separate email with the
password: If Eve can intercept the first email with the link, she is very
probably also able to intercept the second email.

#### Password vs. App Token

Instead of storing your password it's more secure to use an "App Token" with
__*cloud__. There are two ways to get such a token:

* *If you are using Nextcloud or ownCloud:* Open your account in the browser and
  go to Settings -> Security -> App Token and at the bottom of the page generate
  a new token. Copy&paste it into the "App token" field of the Attachments
  preferences page in Thunderbird.

* *Only if you are using Nextcloud:* Type your user password into the
  Attachments/Outgoing preferences page in Thunderbird. Upon saving, the Add-On will
  *try* to get a token from your Nextcloud and use it instead of your password.
  You will notice the change, because afterwards the password field is filled
  with dots completely (app tokens are quite long).\
  **BUT!** if getting the token fails for any reason (e.g. your Nextcloud is not
  reachable, timeout, wrong username, ...), the Add-On will *store your password
  unencrypted*.

#### Handling of existing files

* If you attach a file that's already in the attachments folder in your cloud
  *with identical contents*, that file is not uploaded again. Instead the
  existing file is shared.

* To make this possible, __*cloud__ never deletes files in your cloud. Over time
  your attachments folder may grow to considerable size. It's safe to delete old
  attachments. Your admin may automate that; point her to the [Admin
  Guide](#old-uploads)

* You can use this behavior if you want to share large (or many) files: Sync your
  attachments folder to a folder on your computer using the desktop client. If
  you then attach a synced file from your computer to a message, __*cloud__ will
  notice that it's already uploaded.

* If you attach a file with the same name but different contents as a cloud
  file, the cloud file will not be overwritten. Instead __*cloud__ moves the
  existing file to a subfolder of the attachments folder; the original share
  link will remain valid and point to the old content.\
  Then the new file is uploaded and shared with a new share link.

__*cloud__ uses the same method as the
Nextcloud/ownCloud desktop clients to decide if the local and remote files are
identical.

## Information for cloud administrators

### Server settings

Some settings in Nextcloud/ownCloud are relevant for this Add-On:

* **Settings -> Sharing -> Allow apps to use the Share API** has to be enabled
* **Settings -> Sharing -> Allow users to share via link** has to be enabled
* **The app "Share Files" has to be active.** In ownCloud the Apps management is
  part of the Administrator's settings, in Nextcloud it's accessible directly
  from the Admin's profile menu.

### Old uploads

 __*cloud__ never deletes any file it uploads, because:

* It reuses previous uploads to save bandwidth,
* it can't decide if a file has been downloaded or is still necessary,
* an Addon in a client software is hardly the right place for server maintenance.

So users have to clean up their attachments folder themselves. You may help them
by automatically removing files after some time. This works in Nextcloud and the
Enterprise version of ownCloud:

1. Install and activate two server apps
   * [Files automated tagging](https://apps.nextcloud.com/apps/files_automatedtagging)
   * [Retention](https://apps.nextcloud.com/apps/files_retention)
1. In Settings -> Basic settings in section "Collaborative tags" create a new tag, eg "FilelinkUpload"
1. In Settings -> Flow click "Add new Flow"
   1. Choose "File is changed"
   1. Filter by "Request user agent"
   1. "matches"
   1. "Custom user agent"
   1. Enter `/^Filelink for \*cloud/` as the Regular Expression
   1. As the action choose "Automated tagging"
   1. Select the previously created tag.
   1. Save
1. In the section "File retention"
   1. Select the tag
   1. Enter the number of days before the uploads will be deleted
   1. Create
1. (Optional) In Settings -> Sharing
   1. Choose "Set default expiration date for shares"
   1. Set a default expiry time that is shorter than the retention time you
      configured above. So users will be less confused if their files disappear.
   1. Choose "Enforce expiration date"

This might still delete shared files, because the Retention app deletes them n
days after *creation*, ie upload. If the user shares it again before it is
deleted, the file is not uploaded again and hence the retention timeout is *not
reset*.

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

## Information for Cloud Service Providers

If you run a service based on Nextcloud or ownCloud and would like to offer a
branded/tailored version of __*cloud__ for your service, please contact me by
[email](mailto:cloud@johannes-endres.de).

## Contributing

The project lives on GitLab: <https://gitlab.com/joendres/filelink-nextcloud>.

### Reporting bugs and suggesting features

If you find a bug or have an idea for a feature:

1. Go to the [issues
   board](https://gitlab.com/joendres/filelink-nextcloud/-/boards) and check if
   there is an open issue already.
1. If there no issue describing your problem or your idea, there are two option
   to submit a new one:
   * Open a new issue on the issues board.
   * If you don't have a gitlab account, just send an e-mail to the
     [Service Desk](mailto:cloud@johannes-endres.de).

### Pre-release versions

There usually are two development versions of __*cloud__:

* Release-x.y for the next release that has new features or visible changes for users
* Bugfix-x.y.z for the next release that only fixes bugs

These versions usually are more or less functional. They have corresponding branches in the repository.

All other branches are work in progress and guaranteed not to work :wink:.

### Testing

If you'd like to help with testing, first install one of the development versions:

1. Clone or download one the development branches
1. Pack the contents of the "src" subdirectory (not the subdir itself) into a zip file
1. In Thunderbird go to the Add-ons Manager and from the rotary menu select "Install Add-on from file"
1. Choose your zip file and install

If you find a bug please use one of the [options above](#reporting-bugs-and-suggesting-features) to report it.

### Localizations

If you'd like to have __*cloud__ in a language you are fluent in:

* If you're also fluent in `git`
   1. Clone the latest Release-x.y branch
   1. In `src/_locales` duplicate the directory `en`
   1. Rename the copy to the 2-letter code of your language
   1. Translate all the `message`s in `messages.json` in your new directory.
   1. Create a merge request into the Release-x.y branch you cloned.
* If you're not
   1. Just download the [english strings file](https://gitlab.com/joendres/filelink-nextcloud/-/raw/master/src/_locales/en/messages.json)
   1. Translate alls the `message`s in that file
   1. Mail it to [me](mailto:cloud@johannes-endres.de) stating the language

Important:

* Don't bother with the `descriptions`; they don't show up anywhere, they're just there for your reference.
* If you're not sure about a string's context, just put all your questions in an email or an issue. I'll be glad to clarify.

### Code

If you'd like to fix a bug or implement a feature

* Just branch from the latest Release-x.y or Bugfix-x.y.z branch
* Use [jshint](https://jshint.com/) to check your code.
* Optional: When your code is ready, `git merge` the original branch and resolve
  conflicts. I'll handle all conflicts that arise later.
* If you add strings, just add them to the english locales (and any other
  language you are fluent in), *don't* add english strings to other locales

### Dev resources

* [Nextcloud Client
  APIs](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/index.html)
* [ownCloud External
  API](https://doc.owncloud.com/server/developer_manual/core/apis/ocs/notifications/ocs-endpoint-v1.html)
* [Thunderbird WebExtension
  APIs](https://thunderbird-webextensions.readthedocs.io/en/latest/index.html)
* [JavaScript APIs for WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)),
  some of these are also available in Thunderbird
* [Example extensions for Thunderbird WebExtensions
  APIs](https://github.com/thundernest/sample-extensions)
* [Getting started with
  web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext)
  If you are developing WebExtensions, you want to use this tool. For debugging
  just set the ```firefox``` config option to your thunderbird binary.
* [Photon Components](https://firefoxux.github.io/photon-components-web) contain
  CSS styles and some additional resources to replicate the standard styles used
  in Thunderbird
* [Firefox Brand + Design Assets](https://design.firefox.com/) are also useful
  for Thunderbird, especially the icon library.
* [What you need to know about making add-ons for
  Thunderbird](https://developer.thunderbird.net/add-ons/), not complete at all.
* [@JasonBayton](https://twitter.com/jasonbayton) runs [Nextcloud demo
  servers](https://bayton.org/2017/02/introducing-nextcloud-demo-servers/) of
  many (old) versions, great for testing.

## Contributions

* [Johannes Endres](@joendres), initial implementation, maintainer
* [Josep Manel Mendoza](@josepmanel), catalan and spanish localizations
* [Gorom](@Go-rom), french localization
* [Jun Futagawa](@jfut), implementation of generated random passwords
* [Lionel Elie Mamane](@lmamane), solution of the LDAP/getapppassword problem
* [Óvári](@ovari1), hungarian localization
* Based on [FileLink Provider for
  Dropbox](https://github.com/darktrojan/dropbox) by [Geoff
  Lankow](https://darktrojan.github.io/)
* Inspired by [Nextcloud for
  Filelink](https://github.com/nextcloud/nextcloud-filelink) by [Olivier
  Paroz](https://github.com/oparoz) and [Guillaume
  Viguier-Just](https://github.com/guillaumev).
