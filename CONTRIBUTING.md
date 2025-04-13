<!--
Copyright (C) 2020 Johannes Endres

SPDX-License-Identifier: MIT
-->

# Contributing

The project "__*cloud__ - FileLink for Nextcloud and ownCloud" lives on GitLab: <https://gitlab.com/joendres/filelink-nextcloud>.

## Reporting bugs and suggesting features

If you find a bug or have an idea for a feature:

1. Go to the [issues
   board](https://gitlab.com/joendres/filelink-nextcloud/-/boards) and check if
   there is an open issue already.
1. If there no issue describing your problem or your idea, there are two options
   to submit a new one:
   * Open a new issue on the issues board.
   * If you don't have a gitlab account, just send an e-mail to the
     [Service Desk](mailto:cloud@johannes-endres.de).

## Pre-release versions

There usually are two development versions of __*cloud__:

* Release-x.y.z for the next release that has new features or visible changes
* Bugfix-x.y.z for the next release that only fixes bugs

These versions usually are more or less functional. They have corresponding
branches in the repository.

All other branches are work in progress and guaranteed not to work :wink:.

## Localization / Translation

If you'd like to help translate __*cloud__ into your language,
there are several options.

### Using Crowdin (preferred)

Localizations of __*cloud__ are maintained as a [Crowdin project](https://crowdin.com/project/filelink-nextcloud). If you translate there, it's very easy for us to integrate your contributions into the next __*cloud__ release.

### Adding / Editing files

   1. Just download the [english strings
      file](https://gitlab.com/joendres/filelink-nextcloud/-/raw/master/src/_locales/en/messages.json)
   2. Translate the `message`s in that file
      * Do not translate the `description`; they don't show up anywhere, they're just in there for your reference.
      * If you're not sure about a string's context, just put all your questions in an email or an issue. I'll be glad to clarify.
   3. Mail it to [me](mailto:cloud@johannes-endres.de) or put it into an
      [issue](https://gitlab.com/joendres/filelink-nextcloud/-/issues) stating
      the language

### Using Gitlab Merge Requests

If you already have a gitlab account and are familiar with the system, you can just fork, translate and create a merge request. But I will not directly merge those changes as they will conflict with the ones made on Crowdin. So if this is the easiest way for you, I'm fine with it.

## Code

If you'd like to fix a bug or implement a feature

* Just branch from the latest Release-x.y.z or Bugfix-x.y.z branch
* Optional: When your code is ready, `git merge` the original branch and resolve
  conflicts. I'll handle all conflicts that arise later.
* If you add strings, just add them to the english locales (and any other
  language you are fluent in), _don't_ add english strings to other locales

## Dev resources

* [Nextcloud Client
  APIs](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/index.html)
* [ownCloud External
  API](https://doc.owncloud.com/server/developer_manual/core/apis/ocs-capabilities.html)
* [Thunderbird WebExtension
  APIs](https://webextension-api.thunderbird.net/)
* [Firefox' JavaScript APIs for WebExtensions](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API),
  most of these are also available in Thunderbird
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
  Thunderbird](https://developer.thunderbird.net/add-ons/).
