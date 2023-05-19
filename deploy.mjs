#!/usr/bin/env zx
/// <reference path="node_modules/zx/build/globals.d.ts" />

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

cd(process.env.GITHUB_WORKSPACE);
const shortHash = (await $`git rev-parse --short ${process.env.GITHUB_SHA}`).stdout.trim();

const svnDir = `${process.env.HOME}/svn-repo`;
const svnAuthFlags = [
  `--username`,
  process.env.INPUT_SVN_USERNAME,
  `--password`,
  process.env.INPUT_SVN_PASSWORD,
  `--no-auth-cache`
]

echo(`::group::Checkout della repository SVN`);
await $`svn checkout ${process.env.INPUT_SVN_URL} ${svnDir} --depth immediates ${svnAuthFlags}`;
cd(svnDir);
await $`svn update --set-depth infinity ${process.env.INPUT_SVN_PATH} ${svnAuthFlags}`;
echo('::endgroup::');


const svnIncludePath = path.join(process.env.GITHUB_WORKSPACE, process.env.INPUT_SVN_INCLUDE_FROM);
if (!fs.existsSync(svnIncludePath)) {
  echo(chalk.red(`ℹ︎ Impossibile trovare il file ${svnIncludePath}, annullo il deploy.`));
  await $`exit 1`;
}

// Ci assicuriamo che il path di SVN termini con uno slash
const svnTargetPath = process.env.INPUT_SVN_PATH.replace(/\/$/, '') + '/';

echo(`::group::Copio i file da git a SVN`);
await $`rsync -rc -v --include-from=${svnIncludePath} --exclude="*" --filter 'protect /.svn/' ${process.env.GITHUB_WORKSPACE + '/'} ${svnTargetPath} --delete --delete-excluded`;
echo(`::endgroup::`);

// Dopo l'rsync verifico che non ci siano file di Git
if (process.env.INPUT_ALLOW_GIT_FILES !== 'true') {
  echo(chalk.blue(`➤ Controllo i file nella working copy...`));
  if (fs.existsSync(path.join(svnDir, '.git'))) {
    echo(chalk.red(`ℹ︎ Trovata cartella .git, annullo il deploy.`));
    await $`exit 1`;
  }
  if (fs.existsSync(path.join(svnDir, '.github'))) {
    echo(chalk.red(`ℹ︎ Trovata cartella .github, annullo il deploy.`));
    await $`exit 1`;
  }
}

echo(`::group::Preparo i file per il commit`);
await $`svn add . --force > /dev/null`; // Gestiamo il log con `svn status` più avanti

// Rimuovo i file cancellati
await $`svn status ${svnTargetPath}`
  .pipe($`grep '^\\!'`.nothrow()) // Evitiamo di interrompere lo script se non ci sono file da rimuovere (grep ritorna 1 in caso di nessun match)
  .pipe($`sed 's/! *//'`)
  .pipe($`xargs -I% svn rm %@`); // > /dev/null

await $`svn update ${svnAuthFlags}`;
await $`svn status`;
echo(`::endgroup::`);

const packageJsonPath = path.join(process.env.GITHUB_WORKSPACE, process.env.INPUT_PACKAGE_JSON_PATH);
const { version } = await fs.readJson(packageJsonPath);

const commitMessage = process.env.INPUT_COMMIT_MESSAGE
  .replace(/%version%/g, version)
  .replace(/%sha%/g, shortHash);
echo(chalk.cyan(`ℹ︎ Commit message: ${commitMessage}`));

if (process.env.INPUT_DRY_RUN !== 'false') {
  echo(chalk.yellow(`➤ Dry run: salto il commit.`));
}
else {
  echo(`::group::Effettuo il commit su SVN`);
  await $`svn commit -m ${commitMessage} --non-interactive ${svnAuthFlags}`;
  echo(`::endgroup::`);
}

echo(chalk.green(`✓ Rilasciato su SVN.`));