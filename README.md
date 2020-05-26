# __*cloud__ - FileLink for Nextcloud and ownCloud

A MailExtension for Thunderbird (68+) that uploads large attachments to your
Cloud and generates a link you can send by mail instead of the file.

[[_TOC_]]

## Requirements

* Nextcloud: 16 or newer (older versions might work, but are [not supported by
  Nextcloud](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule))
* ownCloud: 10+ (older versions might work, but are [not supported by
  ownCloud](https://github.com/owncloud/core/wiki/maintenance-and-release-schedule))
* Thunderbird: 68.2.1 or newer (60.5+ might work, but has not been tested)

## User guide

### Installation

1. Go to Settings -> Attachments -> Outgoing
1. Click the link "Find more providers..." at the bottom of the page.
1. Find __*cloud__ in the list and click the "Add to Thunderbird" button.
1. On the "Options" tab click the button "Add *cloud".
1. Configure, only three settings are strictly necessary:
   * Server URL
   * Username
   * App token or password

__*cloud__ is also available via Thunderbird's Add-on
repository:

[![Get the Addon](https://addons.cdn.mozilla.net/static/img/addons-buttons/TB-AMO-button_1.png)](https://addons.thunderbird.net/thunderbird/addon/filelink-nextcloud-owncloud/).

### Good to know

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
  existing file is shared.\
  You can use this, if you want to share large (or many) files: Sync your
  attachments folder to a folder on your computer using the desktop client. If
  you then attach a synced file from your computer to a message, __*cloud__ will
  notice that it's already uploaded. This might not work with uploads from the
  mobile clients, but I haven't tested it.

* If you attach a file with the same name but different contents as a cloud
  file, the cloud file will not be overwritten. Instead __*cloud__ moves the
  existing file to a subfolder of the attachments folder; the original share
  link will remain valid and point to the old content.\
  Then the new file is uploaded and shared with a new share link.

__*cloud__ uses the same method as the
Nextcloud/ownCloud desktop clients to decide if the local and remote files are
identical.

### Known issues

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

#### Attaching files from network shares

If you attach a file from a network share, it's uploaded to the cloud and the share
link is inserted into your mail, but the file is also attached to the message.
This is not a bug in __*cloud__ but a [known bug in
Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=793118). There is
nothing I can do about it in __*cloud__, sorry.

**Workaround:** Copy the file from the network share to your local disk before
attaching it.

#### Upload problems

* The *download* password has to comply with *all* the rules for passwords on
  your cloud, otherwise the *upload* will fail. There are default rules of
  Nextcloud and ownCloud, and your admin might have configured some different
  rules.
* If the Add-On still fails, please check if it's a [known
  bug](https://gitlab.com/joendres/filelink-nextcloud/-/boards). Feel free to
  open a new issue otherwise.

#### Service name in messages is always "*cloud"

When the download url is inserted into the email message, the hosting service is
always shown as "__*cloud__". It would be less confusing, if instead the actual
name of the service would be shown. But this is (currently) not possible, as the
text surrounding the url is part of Thunderbird. And Thunderbird insists on
using the name of the extension here. There's nothing the extension can do about
this, *sorry*.

## Information for cloud administrators

### Server settings

Some settings in Nextcloud/ownCloud are relevant for this Add-On:

* **Settings -> Sharing -> Allow apps to use the Share API** has to be enabled
* **Settings -> Sharing -> Allow users to share via link** has to be enabled
* **The app "Share Files" has to be active.** In ownCloud the Apps management is
  part of the Administrator's settings, in Nextcloud it's accessible directly
  from the Admin's profile menu.

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

1. Go to the [issues board](https://gitlab.com/joendres/filelink-nextcloud/-/boards) and check if there is an open issue already.
1. If there no issue describing your problem or your idea, there are two option to submit a new one:
   * Open a new issue on the issues board.
   * If you don't feel comfortable with that option, send an e-mail to the [Service Desk](mailto:cloud@johannes-endres.de).

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

### Localisations

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

* Don't bother with the `description`s; thy don't show up anywhere, they're just there for your reference.
* If you're not sure about a strings context just put all your questions in a mail or an issue. I'll be glad to clarify.

### Code

If you'd like to fix a bug or implement a feature

* Just branch from the latest Release-x.y or Bugfix-x.y.z branch
* Use [jshint](https://jshint.com/) to check your code.
* Optional: When your code is ready, `git merge` the original branch and resolve conflicts. I'll handle all conflicts that arise later.
* If you add strings, just add them to the english locales (and any other language you are fluent in), don't add english strings to other locales

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
* [Photon Components](https://firefoxux.github.io/photon-components-web) contain CSS styles and some additional resources to replicate the standard styles used in Thunderbird
* [Firefox Brand + Design Assets](https://design.firefox.com/) are also useful for Thunderbird, especially the icon library.
* [What you need to know about making add-ons for
  Thunderbird](https://developer.thunderbird.net/add-ons/), not complete at all.
* [@JasonBayton](https://twitter.com/jasonbayton) runs [Nextcloud demo
  servers](https://bayton.org/2017/02/introducing-nextcloud-demo-servers/) of
  many (old) versions, great for testing.

## Contributions

* [Johannes Endres](@joendres), initial implementation, maintainer
* [Josep Manel Mendoza](@josepmanel), catalan and spanish localisations
* [Gorom](@Go-rom), french localisation
* [Jun Futagawa](@jfut), implementation of generated random passwords
* Based on [FileLink Provider for
  Dropbox](https://github.com/darktrojan/dropbox) by [Geoff
  Lankow](https://darktrojan.github.io/)
* Inspired by [Nextcloud for
  Filelink](https://github.com/nextcloud/nextcloud-filelink) by [Olivier
  Paroz](https://github.com/oparoz) and [Guillaume
  Viguier-Just](https://github.com/guillaumev).
