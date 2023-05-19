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
          svn-path: trunk
          dry-run: true # Opzionale, di default è false
```

## Opzioni

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