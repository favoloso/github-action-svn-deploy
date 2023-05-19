#!/usr/bin/env zx
if (!process.env.INPUT_SVN_USERNAME) {
  echo`Missing INPUT_SVN_USERNAME`;
  await $`exit 1`;
}

if (!process.env.INPUT_SVN_PASSWORD) {
  echo`Missing INPUT_SVN_PASSWORD`;
  await $`exit 1`;
}

if (!process.env.INPUT_SVN_URL) {
  echo`Missing INPUT_SVN_URL`;
  await $`exit 1`;
}

if (!process.env.INPUT_SVN_PATH) {
  echo`Missing INPUT_SVN_PATH`;
  await $`exit 1`;
}

const svnDir = `${process.env.HOME}/svn-repo`;
const svnAuthFlags = [
  `--username`,
  process.env.INPUT_SVN_USERNAME,
  `--password`,
  process.env.INPUT_SVN_PASSWORD,
  `--no-auth-cache`
]

echo`➤ Checkout della repository SVN...`
await $`svn checkout ${process.env.INPUT_SVN_URL} ${svnDir} --depth immediates ${svnAuthFlags}`;
cd(svnDir);
await $`svn update --set-depth infinity ${process.env.INPUT_SVN_PATH} ${svnAuthFlags}`;

echo`➤ Copio i file...`
const svnIncludePath = path.join(process.env.GITHUB_WORKSPACE, process.env.INPUT_SVN_INCLUDE_FROM);
if (!fs.existsSync(svnIncludePath)) {
  echo`ℹ︎ Impossibile trovare il file ${svnIncludePath}, annullo il deploy.`;
  await $`exit 1`;
}

// Ci assicuriamo che il path di SVN termini con uno slash
const svnTargetPath = process.env.INPUT_SVN_PATH.replace(/\/$/, '') + '/';
await $`rsync -rc -v --include="*/" --include=".svn/" --include-from=${svnIncludePath} --exclude="*" --prune-empty-dirs ${process.env.GITHUB_WORKSPACE + '/'} ${svnTargetPath} --delete --delete-excluded`;

// Dopo l'rsync verifico che non ci siano file di Git
if (process.env.INPUT_ALLOW_GIT_FILES !== 'true') {
  echo`➤ Controllo i file di Git...`;
  if (fs.existsSync(path.join(svnDir, '.git'))) {
    echo`ℹ︎ Trovata cartella .git, annullo il deploy.`;
    await $`exit 1`;
  }
  if (fs.existsSync(path.join(svnDir, '.github'))) {
    echo`ℹ︎ Trovata cartella .github, annullo il deploy.`;
    await $`exit 1`;
  }
}

echo`➤ Preparo i file per il commit...`
await $`svn add . --force`; // > /dev/null
await $`svn status ${process.env.INPUT_SVN_PATH} | grep '^\!' | sed 's/! *//' | xargs -I% svn rm %@`; // > /dev/null
await $`svn update ${svnAuthFlags}`;
await $`svn status`;

const packageJsonPath = path.join(process.env.GITHUB_WORKSPACE, process.env.INPUT_PACKAGE_JSON_PATH);
const { version } = await fs.readJson(packageJsonPath);

const shortHash = await $`git rev-parse --short ${process.env.GITHUB_SHA}`;
const commitMessage = process.env.INPUT_COMMIT_MESSAGE
  .replace(/%version%/g, version)
  .replace(/%sha%/g, shortHash);
echo`ℹ︎ Commit message: ${commitMessage}`;

if (process.env.INPUT_DRY_RUN === 'true') {
  echo`➤ Dry run: salto il commit.`
}
else {
  echo`➤ Commit...`
  await $`svn commit -m ${commitMessage} --non-interactive ${svnAuthFlags}`;
}

echo`✓ Rilasciato su SVN.`;