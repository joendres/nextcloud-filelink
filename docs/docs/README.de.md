---
language: "de"
label_pagenav: Seiteninhalt
---
<!--
Copyright (C) 2020 Johannes Endres

SPDX-License-Identifier: MIT
-->

# *cloud - FileLink für Nextcloud OpenCloud ownCloud

Eine MailExtension für Thunderbird (115+), die große Attachments in die Cloud
hochlädt und dann einen Download-Link in die Mail einfügt.

## Voraussetzungen

1. Thunderbird: 115.0 oder neuer
1. Ein Account auf einem Server mit einer unterstützen Version von [Nextcloud](https://nextcloud.com/),
  [OpenCloud](https://opencloud.eu/) oder [ownCloud](https://owncloud.com/), genauer gesagt:
   * Nextcloud Version 32 oder neuer (ältere Versionen funktionieren
    möglicherweise, werden jedoch [von Nextcloud nicht mehr
    unterstützt](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule))
   * OpenCloud Version 4.0 oder neuer (ältere Versionen funktionieren
     möglicherweise, wurden jedoch nicht getestet)
   * ownCloud Classic Version 10.0.10 oder neuer (ältere Versionen haben einen
     Bug, durch den __*cloud__ nicht funktioniert)
   * ownCloud Infinite Scale (oCIS) Version 5 oder neuer (ältere Versionen
    funktionieren möglicherweise, werden jedoch [von ownCloud nicht mehr
    unterstützt](https://owncloud.dev/ocis/release_roadmap/))\
    _Achtung:_ Hierfür benötigst du etwas Hilfe von deinem Administrator, da oCIS
    standardmäßig __*cloud__ nicht unterstützt

   Wenn du keinen eigenen Server betreiben kannst oder willst, bieten verschiedene Unternehmen das als Dienstleistung an:

   * [Liste der Nextcloud-Anbieter](https://nextcloud.com/providers/)
   * [Liste der
    OpenCloud-Anbieter](https://opencloud.eu/en/about-us/partner)
   * [Liste der
    ownCloud-Anbieter](https://owncloud.com/partners/find-a-partner/?_sft_partner-type=service-provider)
  
## Installation

1. Klickein Thunderbird auf Einstellungen -> Verfassen -> Anhänge
1. Klicke dann unten auf den Link "Weitere Anbieter finden..."
1. Finde __*cloud__ in der Liste und drücke den "Zu Thunderbird hinzufügen"-Knopf

## Einrichtung

1. Öffne die Thunderbird-Einstellungen und gehe auf die "Verfassen"-Seite.
2. Klicke unten auf den neuen Knopf "*cloud hinzufügen".
3. Es erscheinen rechts Eingabefelder für die Grundeinstellungen, die du
   ausfüllst. Dabei sind nur drei Einstellungen notwendig:
   * Server-URL
   * Username
   * App-Token

### App-Token für Nextcloud oder ownCloud Classic abrufen

1. Öffne dein Nextcloud- oder ownCloud-Konto im Browser.
2. Gehe zu "Einstellungen" -> "Sicherheit" -> "App-Token".
3. Erstelle unten auf der Seite ein neues Token.
4. Kopiere es und füge es in das Feld "App-Token" auf der Einstellungsseite
  von __*cloud__ in Thunderbird ein.
5. Kopiere auch den _Benutzername_ auf der Einstellungsseite von __*cloud__
  in Thunderbird. Dieser kann sich von deinem normalen Benutzernamen
  unterscheiden.

### App-Token für OpenCloud abrufen

1. Öffne ein OpenCloud-Konto im Browser.
2. Gehe zu "Einstellungen" -> "App-Token".
3. Klicke auf die Schaltfläche "+ Neu".
4. Gib einen beliebigen Namen in das Feld "Notiz" ein (z. B. "*cloud") und
   wähle ein Ablaufdatum für das App-Token aus.
5. Kopiere das App-Token aus dem folgenden Dialogfeld und füge es in das Feld
  "App-Token" auf der __*cloud__-Einstellungsseite in Thunderbird ein.

### App-Token für ownCloud Infinite Scale (oCIS) abrufen

1. Öffne dein oCIS-Konto im Browser
2. Klicke den "Anwendungsumschalter" in der oberen linken Ecke, links neben
   dem ownCloud-Logo
3. Wähle "App-Token"\
   _Falls diese Option im Menü "Anwendungen" fehlt, bitte deinen
   Cloud-Administrator, die App "App-Token" aus dem oCIS App Store zu installieren._
4. Klicke auf die Schaltfläche "Erstellen"
5. Kopiere das App-Token im nächsten Dialogfeld und füge es in das Feld
  "App-Token" auf der __*cloud__-Einstellungsseite in Thunderbird ein.

### Automatisches App-Token für Nextcloud

Bei Nextcloud wird __*cloud__ _versuchen_, ein App-Token für dich zu beziehen:

1. Gib dein Benutzerpasswort in das Feld "App-Token" auf der __*cloud__-
  Einstellungsseite in Thunderbird ein.
1. Klicke "Speichern". __*cloud__  _versucht_ nun, ein Token von deiner
  Nextcloud abzurufen und dieses anstelle des Passworts zu verwenden. Du
  erkennst die Änderung, da das Passwortfeld anschließend vollständig mit
  Punkten ausgefüllt ist (App-Token sind ziemlich lang).

## Benutzung

Nachdem du mindestens einen Nextcloud-, OpenCloud- oder ownCloud-Server
konfiguriert hast, gibt es drei Möglichkeiten, den Upload zu starten:

1. Füge einer Mail einen Anhang hinzu, der größer als die Upload-Schwelle ist.
   Thunderbird zeigt dann eine gelbe Benachrichtigungsleiste am unteren Rand
   des Nachrichtenfensters mit einer Schaltfläche "Filelink verwenden".

   Um diese Schaltfläche für kleinere Anhänge zu erhalten, kannst du den
   Schwellenwert ändern: Gehe zu Einstellungen -> Verfassen -> Anhänge und
   ändere den Wert bei "Hochladen für Dateien größer als ...".
1. Im Nachrichtenfenster gibt es im Menü "Anhängen" (Pfeil nach unten in der
  Schaltfläche "Anhängen") einen Eintrag "Filelink". Damit kannst du eine
   Datei auswählen und und sie sofort hochladen.
1. Nachdem du einen Anhang hinzugefügt hast, kannst du "Anhang umwandeln
   in..." aus dem Kontextmenü des Anhangs wählen (Rechtsklick auf den Anhang).

## FAQ

### Ich habe das Add-on installiert, aber es gibt keine Einstellungsseite. Wie kann ich es konfigurieren?

__Lösung:__ Die Konfiguration findest du in den Einstellungen von Thunderbird,
siehe [Konfigurieren](#Konfigurieren) oben.

### Uploads schlagen fehl und der *cloud-Status lautet "Fehler beim Teilen", aber ich kann die Dateien trotzdem in meiner Cloud finden. Was kann ich tun?

Es gibt drei mögliche Ursachen:

#### Das Freigabelimit von Nextcloud

Standardmäßig erlaubt Nextcloud einem Benutzer, innerhalb eines Zeitraums von
10 Minuten höchstens 20 Freigabelinks zu erstellen. Wenn du innerhalb kurzer
Zeit E-Mails mit vielen Anhängen versendest, kann dieses Limit erreicht
werden.

__Lösung:__ Bitte deinen Cloud-Administrator, das Limit zu erhöhen. Ein
[Abschnitt der Cloud-Admin-Dokumentation](ADMIN.md#rate-limit-on-sharing)
erklärt, wie das Limit geändert wird.

#### Ungültiges Download-Passwort

Das _Download_-Passwort muss allen Passwortregeln der Cloud entsprechen,
andernfalls schlägt der _Upload_ fehl. Nextcloud, OpenCloud und ownCloud
bringen Standard-Passwortregeln mit, und der Administrator hat möglicherweise
zusätzliche Regeln konfiguriert.

__Lösung:__ Wähle ein komplexeres Passwort oder aktiviere die Option "Ein
zufälliges Passwort pro Datei".

#### Fehlerhafte Serverkonfiguration

Probleme beim Teilen können auch durch eine fehlerhafte Konfiguration
des Cloud-Servers verursacht werden.

__Lösung:__ Weise den Cloud-Administrator auf den Abschnitt zu [Apache und
mod_rewrite](ADMIN.md#mod-rewrite) in der Cloud-Admin-Dokumentation hin.

## Das Icon für den Cloud-Dienst wird nicht angezeigt. Erscheint es beim Empfänger?

Wenn du einen Link zu einer Nachricht hinzufügen, sollte das Symbol des Cloud-Dienstes
eben dem Namen des Dienstes erscheinen. Ab Version 135 zeigt Thunderbird
das Icon an dieser Stelle nicht mehr an. Das ist ein [Fehler in
Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=2057816).

Beim Empfänger der Nachricht erscheint das Icon trotzdem.

### Könntest du bitte den Stil des in die Nachricht eingefügten Textes ändern / _X_ hinzufügen / _Y_ entfernen?

Leider geht das nicht.

Add-ons wie __*cloud__ haben dazu keine Möglichkeit, da der die URL umgebende
Vorlagentext Teil von Thunderbird ist. Das Add-on liefert lediglich die URL,
Thunderbird umschließt sie mit seiner Vorlage und fügt das Ganze in Ihre
Nachricht ein.

### Könntest du zumindest das Download-Passwort in die Nachricht einfügen?

Kurze Antwort: Nein, das möchte ich nicht tun.

Hintergrund: Wenn du Download-Passwörter verwendest, füge sie nicht in eine
E-Mail ein, sondern teile sie dem Empfänger über einen separaten, sicheren
Kanal mit, z. B. über einen Messenger oder per Telefon.

Warum? Als Sicherheitsmaßnahme enthalten die generierten Download-Links einen
langen, fast zufälligen Teil. Das bedeutet, dass eine Angreiferin (nennen wir
sie Eva) den Link zu einer Datei nicht erraten oder alle möglichen Links
durchsuchen kann, um eine Datei zu finden. Die einzige realistische
Möglichkeit für Eva ist, die E-Mail abzufangen. Die Links sind daher an sich
ziemlich sicher und für den Empfänger sehr komfortabel, da er nur auf den Link
klicken muss.

Ein Download-Passwort in derselben E-Mail macht die Übertragung daher nicht
sicherer, sondern nur komplizierter für den Empfänger. Das Gleiche gilt für
eine separate E-Mail mit dem Passwort: Wenn Eva die erste E-Mail mit dem Link
abfangen kann, ist sie wahrscheinlich auch in der Lage, die zweite E-Mail
abzufangen.

### Ich habe Dateien mit demselben Namen aus verschiedenen Ordnern geteilt. Doch es wird nur eine Datei hochgeladen und alle Links verweisen auf diese Datei. Was ist los?

Wenn du eine Datei teilst, die

* denselben Namen _und_
* identische Größe _und_
* identische Änderungszeit (auf die Sekunde genau)

wie eine bereits freigegebene Datei hat, betrachtet __*cloud__ diese als
dieselbe Datei und lädt sie nicht erneut hoch. Stattdessen erstellt __*cloud__
einen Freigabelink zur ersten Datei.

Wenn du Dateien hast, die in diesen drei Punkten identisch sind, aber
unterschiedliche Inhalte haben, kann dies dazu führen, dass die falsche Datei
freigegeben wird. Dies könnte beispielsweise passieren, wenn du ein Programm
verwendest, das schnell mehrere Dateien in verschiedenen Ordnern erstellt.

__Lösung:__ Derzeit kannst du nur die Dateinamen ändern oder unterschiedliche
Änderungszeiten festlegen (verwende dazu auf Unix-Systemen den Befehl `touch`
).

### Die URL, die ich für den Zugriff auf mein Cloud-Konto verwende, funktioniert nicht, wenn ich sie in die \*cloud-Konfiguration eingebe. Was kann ich tun?

Es gibt zwei mögliche Ursachen:

#### Weiterleitung

Möglicherweise hat der Cloud-Administrator eine einfache URL konfiguriert, die
deinen Browser auf die eigentliche URL der Cloud weiterleitet. __*cloud__ kann
dieser Weiterleitung nicht automatisch folgen.

__Lösung:__

1. Melde dich im Browser bei deinem Cloud-Konto an.
2. Kopiere die URL _nach der Anmeldung_
3. Füge  sie in die __*cloud__-Konfiguration in Thunderbird ein.

#### HTTPS-Zertifikat

Wenn der Cloud-Administrator ein "selbstsigniertes Zertifikat" verwendet hat,
verweigert Thunderbird (nicht __*cloud__) den Verbindungsaufbau.

__Lösung 1 (besser):__ Informieren den Administrator über das Problem.
Möglicherweise [installiert er ein anderes
Zertifikat](ADMIN.md#self-signed-certificates), das Thunderbird akzeptiert.

__Lösung 2 (falls Lösung 1 nicht möglich ist):__ Zwinge
Thunderbird, das Zertifikat zu akzeptieren:

1. Öffne die Einstellungen von Thunderbird
2. Gehe zu "Datenschutz & Sicherheit"
3. Scrolle nach unten zu "Zertifikate"
4. Klicke auf "Zertifikate verwalten"
5. Wähle "Server"
6. Klicke auf "Ausnahme hinzufügen"
7. Gib die Adresse der Cloud in das Feld "Standort" ein
8. Klicke auf "Zertifikat abrufen"
9. Klicke auf "Sicherheitsausnahme bestätigen"

### Funktioniert es immer noch nicht?

Sollte es weiterhin nicht funktionieren, würde ich mich über eine
Fehlermeldung per [E-Mail](mailto:cloud@johannes-endres.de) freuen.
Vielen Dank.
