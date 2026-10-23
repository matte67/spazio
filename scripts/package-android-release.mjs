import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const signedReleaseApk = resolve(
  'android/app/build/outputs/apk/release/app-release.apk',
);
const distributionDirectory = resolve('dist');
const distributionApk = resolve(distributionDirectory, 'Spazio.apk');

try {
  await mkdir(distributionDirectory, { recursive: true });
  await copyFile(signedReleaseApk, distributionApk);
  process.stdout.write(`APK release firmato pronto: ${distributionApk}\n`);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    process.stderr.write(
      'APK release firmato non trovato. Configura le variabili SPAZIO_KEYSTORE_PATH, ' +
        'SPAZIO_KEYSTORE_PASSWORD, SPAZIO_KEY_ALIAS e SPAZIO_KEY_PASSWORD, poi ripeti il comando.\n',
    );
    process.exitCode = 1;
  } else {
    throw error;
  }
}
