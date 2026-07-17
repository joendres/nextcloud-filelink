<!--
SPDX-FileCopyrightText: (C) 2026 Johannes Endres

SPDX-License-Identifier: MIT
-->

# Information for Cloud Administrators

[[_TOC_]]

## Nextcloud

### Server Settings

* __Settings -> Sharing -> Allow apps to use the Share API__ has to be enabled
* __Settings -> Sharing -> Allow users to share via link__ has to be enabled
* __The app "Share Files" has to be active.__

### Rate Limit on Sharing

By default, Nextcloud limits each user to 20 share link creations within any
10-minute interval. If users of __*cloud__ send emails with many attachments
in a short time, they may hit this limit: Uploads succeed, but sharing fails
with a generic error message.

To raise the limit, add the following to your Nextcloud `config/config.php`:

```php
'ratelimit_overwrite' => [
  'files_sharing.shareapi.createshare' => [
    'user' => ['limit' => 50, 'period' => 600],
  ]
],
```

This example allows 50 share link creations per 10 minutes. Adjust `limit` and
`period` (in seconds) to your needs.

This raises the limit only for share link creation; all other rate limits stay
unchanged.

## ownCloud Classic

* __Settings -> Sharing -> Allow apps to use the Share API__ has to be enabled
* __Settings -> Sharing -> Allow users to share via link__ has to be enabled
* __The app "Share Files" has to be active.__

## ownCloud Infinite Scale (oCIS)

oCIS does not support __*cloud__ out of the box. You have to two options to
enable it:

### Enable App Tokens (preferred)

1. Enable the [Auth App
   Service](https://doc.owncloud.com/ocis/next/admin/deployment/services/s-list/auth-app.html).
   This requires _two_ environment variables:
    * OCIS_ADD_RUN_SERVICES=auth-app
    * PROXY_ENABLE_APP_AUTH=true
2. Add the app [App
   Tokens](https://github.com/mschlachter/ocis-app-tokens) to your oCIS
   instance. This allows users to create their own App Tokens.

### Enable HTTP Basic Auth (not recommended)

The [oCIS documentation](https://doc.owncloud.com/ocis/7.3/deployment/services/s-list/proxy.html#authentication) explicitly says:
>
> * Basic Auth (Only use in development, __never in production__ setups!)

and
>
> * In a production deployment, you want to have basic authentication [...]
_disabled_ which is the default state.

[Activating the Auth Basic Service](https://doc.owncloud.com/ocis/next/deployment/services/s-list/auth-basic.html) does not enable App Tokens but allows the users to use their passwords with __*cloud__.

## All Webservers

### Redirects

In some configurations a start url like `https://cloud.example.com` is
redirected to the actual url of the cloud eg `https://example.com/cloud`.
__*cloud__ has to access many different paths below this url, eg.
`status.php`. If these are not also redirected
(`https://cloud.example.com/status.php` ->
`https://example.com/cloud/status.php`), __*cloud__ can't access them and
doesn't work. There is no way for the extension to find the actual base url
with some certainty.

There is a workaround: Users can find out the actual url and configure it in
__*cloud__. But it's easier for users if all urls are redirected. So it would
be greatly appreciated if you would do that in your cloud instance (if you
have to use redirects at all). Thanks.

### Self-signed certificates

By default Thunderbird (not __*cloud__) refuses https connections using
self-signed certificates. It's a lot easier for your users, if you install a
[Let's encrypt](https://letsencrypt.org/getting-started/) certificate. There
are great How-tos on their site.

## Apache

### mod_rewrite

[Nextcloud](https://docs.nextcloud.com/server/latest/admin_manual/installation/source_installation.html#additional-apache-configurations)
and [ownCloud Classic](https://doc.owncloud.com/server/next/admin_manual/troubleshooting/general_troubleshooting.html)
both require mod_rewrite to be active if run in the Apache http server.
Without mod_rewrite __*cloud__ fails with different error scenarios depending
on other details of the configuration.

## Deploy Settings with Enterprise Policies

__*cloud__ accounts can be configured with [Thunderbird Enterprise Policies](https://enterprise.thunderbird.net/manage-updates-policies-and-customization/managing-thunderbird-policies). Here a partial example:

```json
{
  "policies": {
    "Preferences": {
      "mail.cloud_files.accounts.INTERNAL_ID_GOES_HERE.displayName": {
        "Value": "YOUR CLOUD NAME GOES HERE"
      },
      "mail.cloud_files.accounts.INTERNAL_ID_GOES_HERE.type": {
        "Value": "ext-cloud@johannes-endres.de"
      }
    },
    "3rdparty": {
      "Extensions": {
        "cloud@johannes-endres.de": {
          "accounts": {
            "INTERNAL_ID_GOES_HERE": {
              "serverUrl": {
                "Value": "https://cloud.example.com",
                "Status": "locked"
              },
              "username": {
                "Value": "john_doe"
              }
            }
          }
        }
      }
    }
  }
}
```

The first two policies under `"Preferences"` create a __*cloud__ account.
Thunderbird requires these entries to exist before the Addon can configure the
account; the Addon can't create accounts itself.

In both entries you have to have the same internal ID. You can choose any
string of letters and numbers (no spaces).
> Do _not_ use an internal ID in the form "account"+number (like account10) as
> Thunderbird uses IDs of this format for accounts a user creates manually in
> the UI.

The _internal ID_ usually doesn't appear in the UI, but advanced users might
find it. The `Value` of the `displayName` setting is just that: Thunderbird
shows it in the UI and adds it to the link (in HTML messages).

You can deploy multiple accounts with different internal IDs.

The actual __*cloud__ account settings are in the `accounts` object. For every
account you have to add a settings object. The key has to be your _internal
ID_ exactly.

Currently only these fields can be set via the policies mechanism:

* serverUrl
* username
* password
* storageFolder

Most other options of a __*cloud__ account (e.g. mandatory download
password) can be enforced by cloud server configurations. (If you don't agree
please open an issue explaining why you need which setting.)

`"Status": "locked"` on settings of __*cloud__ (under `"3rdparty"`) does not
strictly lock these settings, it disables the fields in the UI. Advanced users
might find a way to change them.

`locked` settings for __*cloud__ are overwritten with the `Value` on every
start of Thunderbird. Settings that don't have `"Status": "locked"` will not
be overwritten but will keep user changes.

### Additional Information

* `"Status": "clear"` works similar to the [Preferences
  policies](https://firefox-admin-docs.mozilla.org/reference/policies/preferences/)
  for __*cloud__ settings too: It removes the particular __*cloud__ setting.
  This might lead to an empty field or the default being used.
* Setting `"Status": "locked"` on the two Preferences that create an account
  doesn't work as expected: Thunderbird only observes this in the
  `about:config` dialog; in the "Compose" settings users can still rename and
  remove the account.
* The documentation for [Configuring Firefox using
  policies.json](https://firefox-admin-docs.mozilla.org/guides/policies-configuration/#configuring-firefox-using-policiesjson)
  is far more detailed than the documentation for Thunderbird. But with a
  grain of salt it applies to Thinderbird, too.
