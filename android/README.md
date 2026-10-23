# Host Android · Spazio

Per installare Spazio su una TV e impostarlo come schermata Home, segui la
[guida per utenti](../README.md#installazione-in-breve). Questa pagina raccoglie
invece dettagli di build e implementazione per chi sviluppa o mantiene l’app.

Requisiti: JDK 17 o 21, Android SDK Platform 35 / Build Tools 35.0.0,
Platform Tools ADB. `minSdk=30` (Android 11), `targetSdk=35`.
Il wrapper fissa Gradle 8.11.1; AGP 8.9.2 e Kotlin 2.1.20.

## Build e installazione

Configura `ANDROID_HOME` oppure crea `android/local.properties` (non versionato)
con `sdk.dir=/percorso/assoluto/sdk`. Dalla root del progetto:

```sh
npm ci
npm run android:build
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n it.spazio.tv/.MainActivity
```

Se sono collegati più dispositivi, aggiungi `-s SERIAL_TV` ai comandi ADB. Per il
debug wireless, associa prima la TV con `adb pair` quando richiesto dal suo menu,
poi esegui `adb connect IP_TV:PORTA` e usa `-s IP_TV:PORTA` per selezionarla.
La prima connessione richiede la conferma RSA sulla TV. `app-debug.apk` è una
build di sviluppo, non un artefatto firmato per la pubblicazione. Non sono inclusi
segreti o chiavi di distribuzione. Android Studio può importare direttamente questa cartella.

## Responsabilità

- `MainActivity`: asset loader HTTPS locale, ciclo di vita WebView, input D-pad/Back/Menu e nuovi Intent Home.
- `ApplicationRepository`: contratto per elenco e risoluzione app avviabili.
- `AndroidApplicationRepository`: PackageManager, etichette e banner/icone PNG.
- `InputShortcutRepository`: disponibilità e apertura degli ingressi consentiti, separati dai pacchetti app.
- `LauncherBridge`: dispatch RPC con whitelist, mapping JSON e gestione errori.

L’HTML Android usa un viewport logico di 1920px e WebView lo adatta al pannello,
indipendentemente dalla densità impostata dal produttore. La preview browser mantiene
`device-width`. Il device non viene identificato da assunzioni su modello o risoluzione:
il bridge legge `Build.MODEL`, `Build.VERSION.RELEASE` e le app TV effettivamente visibili.

## Contratto bridge v1

Il web invia esclusivamente JSON tramite `window.AndroidLauncher.postMessage`:

```json
{ "id": "rpc-1", "method": "launchApplication", "params": { "id": "com.netflix.ninja" } }
```

`getApplications` restituisce nome, ID, icona e banner come campi distinti;
il banner è facoltativo e la UI può usare l’icona come sfondo di riserva.
Android risponde invocando `window.spazioNativeResponse` con un oggetto:

```json
{ "id": "rpc-1", "result": null }
```

In caso di errore: `{"id":"rpc-1","error":"Messaggio operativo"}`.
Metodi consentiti: `getApplications`, `getDeviceInfo`, `launchApplication`,
`getInputShortcuts`, `openInputShortcut`, `getHomeContent`, `openHomeContent`,
`requestContentAccess`, `openSystemSettings`. Il client correla gli ID, valida i DTO e scade dopo 12 secondi.
Le letture PackageManager e le icone vengono elaborate fuori dal thread UI.
Gli Intent vengono avviati sul thread UI e risolti solo dalle app TV consentite.
Non esiste fallback a dati dimostrativi quando il bridge Android fallisce.

## Contenuto e navigazione

La pagina è caricata da
`https://appassets.androidplatform.net/assets/launcher/index.html` tramite
`WebViewAssetLoader`. Sono bloccati navigazione remota, frame, accesso file/content
e schemi estranei. Il permesso Internet è limitato nell’implementazione al caricamento
nativo delle copertine autorizzate. Il debug WebView è attivo
solo nelle build debug. Le icone native ammettono solo PNG base64 di dimensione limitata.

Back e D-pad vengono inoltrati alla stessa gestione input usata dalla preview.
Menu, quando Spazio è in primo piano, torna alle preferite. Un nuovo Intent Home chiude
pannelli e torna alle preferite tramite l’evento `spazio-home`. Home viene instradato da Android.
La dichiarazione `HOME` rende Spazio candidato come launcher; la sola installazione **non**
cambia il launcher predefinito.

### Home sulla MiTV-MSSP2 Android 11

La procedura per utenti, compresi avvisi e comandi di ripristino, è descritta nella
[guida di installazione](../README.md#caso-speciale-mitv-mssp2).

Il firmware assegna priorità 2 a Google TV: il solo `set-home-activity` salva la scelta
ma continua a risolvere Home su Google TV. Per rendere effettiva la scelta richiesta,
il launcher Google TV è stato disabilitato per l’utente 0; il pacchetto rimane installato.
La modifica non richiede root. Configurazione ADB usata:

```sh
adb shell pm disable-user --user 0 com.google.android.tvlauncher
adb shell cmd package set-home-activity --user 0 it.spazio.tv/.MainActivity
adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME
```

Ripristino del launcher originale (prima di disinstallare Spazio):

```sh
adb shell pm enable --user 0 com.google.android.tvlauncher
adb shell cmd package set-home-activity --user 0 com.google.android.tvlauncher/.MainActivity
adb shell input keyevent 3
```

La pressione Home va verificata anche da un’altra applicazione. I tasti dedicati Xiaomi
possono avere percorsi diversi da Home; il comportamento fuori da Spazio appartiene al firmware.

## Manutenzione

```sh
cd android
./gradlew lintDebug assembleDebug
```

Il contenuto web viene aggiornato con `npm run android:assets` dalla root prima della
compilazione. `npm run android:build` esegue entrambi i passaggi.

Fonti: [contenuto locale WebView](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content),
[visibilità pacchetti Android 11](https://developer.android.com/training/package-visibility/declaring),
[app TV](https://developer.android.com/training/tv/get-started/create).

## Contenuti condivisi dalle app

`AndroidHomeContentRepository` legge `WatchNextPrograms` e `PreviewPrograms` usando
il permesso runtime `android.permission.READ_TV_LISTINGS`. La sezione non ottiene
`ACCESS_ALL_EPG_DATA`, non legge database privati e non promette tutte le righe della
Home Google. La TV può pubblicare solo una parte dei contenuti delle singole app.

La richiesta permesso parte da “Consenti accesso”; negarla lascia utilizzabile il launcher.
Nell’installazione di sviluppo il permesso è stato concesso via ADB per la prova autorizzata.
Il repository limita i risultati a 20 elementi per tipo e 8 per app, filtra record non
navigabili e app non avviabili, e conserva gli Intent soltanto nel processo Android.

RPC aggiunte: `getHomeContent`, `openHomeContent` (solo ID presente nel repository),
`requestContentAccess`. Errori e assenza di dati non impediscono l’apertura delle app.
Il client aggiorna al ritorno Home e ogni minuto mentre la sezione è abilitata e visibile.

`HomeArtworkLoader` rende disponibili immagini locali del provider e copertine HTTPS,
con limiti di lettura (2 MiB), decodifica (24 megapixel), timeout e cache (4 MiB).
L’utente ha autorizzato esplicitamente il permesso Internet per le copertine. Le richieste
sono native: solo URL provenienti dai record visibili, HTTPS, massimo due redirect,
nessun indirizzo di rete locale e nessun URL scelto dalla UI. In caso di errore compare
l’icona locale dell’app. L’accesso alla riproduzione Spotify mediante
notification listener e permessi multimediali non fa parte di questa integrazione.

## Collegamento PS4 → HDMI 3

Il preferito `shortcut:ps4-hdmi3` usa il logo PS4 locale e viene aggiunto una sola
volta in fondo all’ordine salvato (preferenze versione 2). La rimozione successiva
è rispettata; può essere aggiunto di nuovo dalla griglia Applicazioni.

`AndroidInputShortcutRepository` contiene la mappatura verificata sulla MiTV-MSSP2:
HDMI 3 corrisponde a `com.mediatek.tvinput/.hdmi.HDMIInputService/HW4`.
Prima di esporre la card controlla che l’ingresso passthrough HDMI esista e che
sia disponibile un’activity esportata per aprirlo. Su altri firmware la card
non compare se questa capacità manca; la mappatura non è universale.

L’apertura usa `TvContract.buildChannelUriForPassthroughInput` con
`ACTION_VIEW` e MIME `vnd.android.cursor.item/channel`, necessario su questa TV.
La pagina invia soltanto l’ID consentito, mai URI o Intent arbitrari:

```json
{ "id": "rpc-2", "method": "openInputShortcut", "params": { "id": "shortcut:ps4-hdmi3" } }
```

Il collegamento seleziona l’ingresso; l’accensione della console non è gestita.
La preview desktop mostra una conferma informativa, senza simulare il cambio ingresso.
