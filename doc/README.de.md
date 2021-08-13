# __*cloud__ - FileLink für Nextcloud und ownCloud

Eine MailExtension für Thunderbird (68+), die große Attachments in die Cloud
hochlädt und dann einen Download-Link in die Mail einfügt.

[[_TOC_]]

## Voraussetzungen

* Nextcloud: Version 20 oder neuer (ältere Versionen funktionieren eventuell,
  werden aber [von Nextcloud nicht mehr
  unterstützt](https://github.com/nextcloud/server/wiki/Maintenance-und-Release-Schedule))
* ownCloud: Version 10.0.10 oder neuer (10.0.9 und ältere Versionen enthalten
  einen Fehler, durch den __*cloud__ nicht funktioniert).
* Thunderbird: 68.2.1 oder neuer

## Installation

1. Klicke auf Einstellungen -> Verfassen -> Anhänge
1. Klicke dann unten auf den Link "Weitere Anbieter finden..."
1. Finde __*cloud__ in der Liste und drücke den "Zu Thunderbird hinzufügen"-Knopf
1. Nun gibt es auf der "Anhänge"-Seite einen neuen Knopf "*cloud hinzufügen", den du drückst
1. Es erscheinen rechts Eingabefelder für die Grundeinstellungen, die du nun
   ausfüllst. Dabei sind nur drei Einstellungen notwendig:
   * Server-URL
   * Username
   * App-Token oder Passwort

### Variante

__*cloud__ gibt es auch in der Addon-Sammlung von Thunderbird:

[![Hol dir das Addon](https://addons.cdn.mozilla.net/static/img/addons-buttons/TB-AMO-button_1.png)](https://addons.thunderbird.net/thunderbird/addon/filelink-nextcloud-owncloud/).

## Bekannte Probleme

### Du möchtest den Text ändern, den Thunderbird mit dem Link in die Mail einbaut

Viele Benutzer möchten einen anderen Text mit der Download-URL in die Nachricht
eingefügen, z.B. das Ablaufdatum einfügen, den Link zum Cloud-Dienst ändern,
einen Teil des Textes entfernen oder den HTML-Code weniger prominent gestalten.
Doch leider haben Addons wie __*cloud__ keine Chance dazu, da der Vorlagentext
ein Teil von Thunderbird ist. Das Addon liefert nur die URL; Thunderbird steckt
sie in seine Vorlage und fügt das Ganze in Ihre Nachricht ein (technische
Details auf Englisch
[hier](https://gitlab.com/joendres/filelink-nextcloud/-/issues/238#note_383881835)
und
[hier](https://thunderbird-webextensions.readthedocs.io/en/68/cloudFile.html#onfileupload-account-fileinfo)).

Es gibt einen Änderungsvorschlag für Thunderbird, [diese Vorlage bearbeitbar zu
machen (englisch)](https://bugzilla.mozilla.org/show_bug.cgi?id=1643729).
Vielleicht möchtest du diesen Vorschlag mit deiner Stimme oder einem hilfreichen
Kommentar zu unterstützen.

### Dateien von Netzwerkfreigaben werden in die Cloud hochgeladen *und* angehängt

Es gab einen [Fehler in
Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=793118): Wenn man eine
Datei von einer Netzwerkfreigabe anhängte, wurde sie in die Cloud hochgeladen
und der Link wurde in die Mail eingefügt, aber *zusätzlich* wurde die Datei auch
an die Mail angehängt. Dies wurde in Thunderbird 68.11.0 und 78.0.1 behoben.
Wenn dieses Problem bei dir noch auftritt, aktualisiere bitte Thunderbird.

### URL funktioniert im Browser, aber nicht in den Einstellungen von *cloud

In einigen Situationen funktioniert die URL, mit der du auf dein Nextcloud- oder
ownCloud-Konto zugreifen kannst, nicht in __*cloud__.

#### Ursache 1: URL-Umleitung (Redirect)

Wenn Ihre Zugriffs-URL zum tatsächlichen Cloud-Standort umgeleitet wird (plus
ein technisches Detail), kann __*cloud__ die tatsächliche URL nicht selbst
herausfinden.

Wenn dir dies passiert, zeige __*cloud__ die tatsächlichen Cloud-URL:

1. Öffne deine Cloud im Browser.
1. Melde dich an.
1. Abhängig von der Cloud-Version hast du jetzt unterschiedliche Ansichten:
   * In Nextcloud 20 siehst du das "Dashboard"; mach einfach mit dem nächsten
     Schritt weiter.
   * In älteren Versionen von Nextcloud und in ownCloud siehst du normalerweise
     die App "Dateien". Auch dann geht es mit dem nächsten Schritt weiter.
   * Wenn du dich weder im "Dashboard" noch in der "Dateien" -App befindest,
     klickst du auf das Ordnersymbol im Hauptmenü der Cloud, um zur App
     "Dateien" zu gelangen.
1. Kopiere die vollständige URL aus der URL-Leiste des Browsers
1. Füge sie in das Server-URL-Feld in der Konfiguration von __*cloud__ ein (in
   Thunderbird). Wenn du die Einstellungen speicherst, entfernt __*cloud__
   unnötige Teile.

#### Ursache 2: https-Zertifikat

Wenn der Administrator deiner Cloud ein sogenanntes "selbstsigniertes
Zertifikat" verwendet hat, weigert sich Thunderbird (nicht __*cloud__), eine
Verbindung zum Server herzustellen. Es gibt zwei Lösungen:

1. (besser) Informiere deinen Administrator über das Problem. Er sollte
   [einen anderen Zertifikat-Typ
   installieren](https://gitlab.com/joendres/filelink-nextcloud#self-signed-certificates),
   das Thunderbird akzeptiert.
1. (falls 1. nicht möglich ist) Thunderbird zwingen, das Zertifikat zu akzeptieren:
   1. Öffne die Einstellungen von Thunderbird
   1. Gehe zu "Datenschutz & Sicherheit"
   1. Scrolle ganz nach unten zum Bereich "Zertifikate"
   1. Klicke auf "Zertifikate verwalten".
   1. Wähle "Server"
   1. Klicke auf "Ausnahme hinzufügen".
   1. Gib die Adresse der Cloud in das Feld "Adresse" ein
   1. Klicke auf "Zertifikat herunterladen".
   1. Klicke auf "Sicherheits-Ausnahmeregel bestätigen".

### Probleme beim Hochladen

Das *Download*-Passwort muss *allen* Regeln für Passwörter entsprechen, die der
Admin deiner Cloud konfiguriert hat. Andernfalls schlägt der *Upload* fehl.

#### Funktioniert immer noch nicht?

Wenn die Einstellungen immer noch nicht funktionieren, würde ich mich über einen
Problembericht per [E-Mail](mailto:cloud@johannes-endres.de) freuen. Vielen
Dank.

## Gut zu wissen

### Download-Passwörter

Wenn du Download-Passwörter verwendest, gib sie *niemals* in eine E-Mail ein,
sondern teile sie dem Empfänger über einen separaten, sicheren Kanal mit, z.B.
über einen Messenger oder einen Telefonanruf.

Warum? Aus Sicherheitsgründen enthalten die generierten Download-Links einen
langen, zufälligen Teil. Ein Angreifer (nennen wir sie Eva) kann den Link für
eine Datei nicht erraten oder alle möglichen Links durchprobieren, um eine Datei
zu finden. Um Zugriff auf deine Datei zu erhalten, müsste Eva die E-Mail
abfangen.

Die Links sind also für sich genommen ziemlich sicher und für die Empfänger
recht komfortabel, weil sie nur auf den Link klicken müssen.

Wenn du Download-Passwörter verwendest, füge sie *niemals* in dieselbe
E-Mail wie den Link ein. Denn wenn Eva den Link lesen kann, kann sie auch das
Passwort lesen. Also macht ein Download-Passwort in derselben E-Mail die
Übertragung nicht sicherer, sondern nur kompliziert für den Empfänger. Gleiches
gilt für eine separate E-Mail mit dem Passwort: Wenn Eve die erste E-Mail mit
dem Link abfangen kann, ist sie sehr wahrscheinlich auch in der Lage, die zweite
E-Mail abzufangen.

### Passwort vs. App Token

Anstatt dein Passwort zu speichern, ist es sicherer, in __*cloud__ ein "App
Token" zu verwenden. Es gibt zwei Möglichkeiten, um ein solches Token zu
erhalten:

* *Wenn du Nextcloud oder ownCloud verwendest:* Öffne dein Konto im Browser und
  Gehe zu Einstellungen -> Sicherheit und generiere unten auf der Seite ein
  neues Token. Kopiere und füge es in das Feld "App-Token" der
  __*cloud__-Einstellungen in Thunderbird ein.

* *Nur wenn du Nextcloud verwendest:* Gib dein Passwort in die
  __*cloud__-Einstellungen in Thunderbird ein. Beim Speichern wird das Add-On
  *versuchen* ein Token von deiner Nextcloud zu bekommen und benutzt es dann
  anstelle deines Passworts. Du erkennst die Änderung, da anschließend das Feld
  Passwort vollständig mit Punkten ausgefüllt ist (App-Token sind ziemlich
  lang). \
  **ABER!** Wenn das Abrufen des Tokens aus irgendeinem Grund fehlschlägt (z.B.
  weil die Nextcloud nicht erreichbar ist, Timeout, falscher Benutzername, ...),
  speichert das Add-On dein *Passwort unverschlüsselt*.

### Umgang mit hochgeladenen Dateien

Wenn du eine Datei anhängst, die sich bereits mit *identischem Inhalt* im
Anhänge-Ordner in der Cloud befindet, lädt __*cloud__ diese Datei nicht erneut
hoch. Stattdessen wird die vorhandene Datei freigegeben.

Um dies zu ermöglichen, löscht __*cloud__ niemals Dateien aus der Cloud. Im
Laufe der Zeit kann dein Anhänge-Ordner ziemlich groß werden. Dann kannst du
einfach alte Anhänge löschen, die du nicht mehr brauchst.

Du kannst dieses Verhalten ausnutzen, wenn du sehr große (oder viele) Dateien
freigeben möchtest: Synchronisiere mithilfe des Desktop-Clients deinen
Anhänge-Ordner mit einem Ordner auf deinem Computer. Wenn du anschließend eine
synchronisierte Datei deinem Computer an eine Nachricht anhängst, erkennt
__*cloud__, dass sie bereits hochgeladen ist.

Wenn du eine Datei anhängst, die mit demselben Namen aber unterschiedlichem
Inhalt schon in der Cloud liegt, wird sie dort nicht überschrieben. Stattdessen
verschiebt __*cloud__ die vorhandene Datei in einem Unterordner des
Anhangsordners; der ursprüngliche Download-Link bleibt gültig und verweist auf
den alten Inhalt.\
Anschließend wird die neue Datei hochgeladen und mit einem neuen Freigabelink
geteilt.

__*cloud__ verwendet dieselbe Methode wie die
Nextcloud/ownCloud-Desktop-Clients, um zu entscheiden, ob die lokalen und
Remote-Dateien identisch sind.

## Beiträge

* [Johannes Endres](@joendres), Erstimplementierung, Maintainer
* [Josep Manel Mendoza](@josepmanel), katalanische und spanische Übersetzungen
* [Gorom](@Go-rom), französische Übersetzung
* [Jun Futagawa](@jfut), Implementierung generierter zufälliger Passwörter
* [Lionel Elie Mamane](@lmamane), Lösung des LDAP/getapppassword-Problems
* [Óvári](@ovari1), ungarische Übersetzung
* [Pietro Federico Sacchi](https://crowdin.com/profile/sacchi.pietro), italienische Übersetzung
* [Asier Iturralde Sarasola](https://gitlab.com/aldatsa), baskische Übersetzung
* Basierend auf [FileLink Provider für
  Dropbox](https://github.com/darktrojan/dropbox) von [Geoff
  Lankow](https://darktrojan.github.io/)
* Inspiriert von [Nextcloud für
  Filelink](https://github.com/nextcloud/nextcloud-filelink) von [Olivier
  Paroz](https://github.com/oparoz) und [Guillaume
  Viguier-Just](https://github.com/guillaumev).
* Enthält [punycode.js](https://github.com/bestiejs/punycode.js), Copyright
  Mathias Bynens,
  [MIT-Lizenz](https://github.com/bestiejs/punycode.js/blob/master/LICENSE-MIT.txt)
* Enthält [photon-components-web](https://firefoxux.github.io/photon-components-web/)
