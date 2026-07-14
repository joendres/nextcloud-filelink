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
