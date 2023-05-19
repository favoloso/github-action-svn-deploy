# github-action-svn-deploy

GitHub Action per la pubblicazione e la sincronizzazione su SVN

## Setup

Realizzata con [`google/zx`](https://github.com/google/zx).

## Utilizzo

```yaml
name: Deploy
on:
  push:
    branches:
      - master
jobs:
  commit:
    name: Commit SVN
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Deploy SVN
        uses: favoloso/github-action-svn-deploy@main
        with:
          svn-username: ${{ secrets.SVN_USERNAME }}
          svn-password: ${{ secrets.SVN_PASSWORD }}
          svn-url: ${{ secrets.SVN_URL }}
          svn-include-from: .svninclude
          svn-path: trunk
          dry-run: true # Opzionale, di default è false
```

## Opzioni

### `svn-include-from`

Path al file che contiene l'elenco dei path da includere nel commit. È obbligatorio e puntare ad un file esistente che descrivere un elenco di file da includere nel commit.
Vedere `man rsync` per la documentazione di `--include-from`.
È l'opposto di un file `.gitignore`.

#### Note sui file inclusi

- Le cartelle devono essere indicate con lo **/ finale** e tre asterischi `***`, (es. `assets/***`)
- Le cartelle e i file annidati devono avere più entry che includono anche la cartella superiore (es. `assets/` e `assets/images/`, solo `assets/images/` non funziona)

### `dry-run`

Se impostato a `true` non effettua il commit su SVN, ma mostra solo le modifiche che verranno effettuate.

### `commit-message`

Messaggio di commit da utilizzare. Di default è `Rilascio %version%`.
Possono essere utilizzate le seguenti variabili:

- `%version%`: versione del package.json. Il percorso del file può essere impostato con `package-json-path`
- `%sha%`: SHA dell'ultimo commit (versione _short_)

### `package-json-path`

Percorso del file `package.json` da utilizzare per estrarre la versione. 
Di default è `package.json`.