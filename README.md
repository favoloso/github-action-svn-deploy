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
        uses: favoloso/github-action-svn-deploy@v1
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
  - `***` indica "la cartella stessa e tutti i suoi sottonodi"
- In caso si voglia *escludere* una cartella, si può indicare con `- path` in una riga dedicata
  - È necessario inserire la regola di esclusione **prima** della regola di inclusione della cartella padre
- Le cartelle e i file annidati devono avere più entry che includono anche la cartella superiore (es. `assets/` e `assets/images/`, solo `assets/images/` non funziona)
- È possibile aggiungere commenti con `#` all'inizio della riga

#### Esempio

```
- /assets/private/***
/assets/***
/src/***
# Oppure, se ad esempio ci sono solamente src/{js,css,dist} e si vuole includere solo dist 
# (notare l'inclusione di `src` su linea dedicata)
src/
src/dist/***
```

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
