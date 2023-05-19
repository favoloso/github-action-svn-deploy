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
        uses: actions/checkout@v2
      - name: Deploy
        uses: favoloso/github-action-svn-deploy@main
        with:
          svn-user: ${{ secrets.SVN_USER }}
          svn-password: ${{ secrets.SVN_PASSWORD }}
          svn-url: ${{ secrets.SVN_URL }}
          svn-path: ${{ secrets.SVN_PATH }}
          dry-run: true # Opzionale, di default è false
```
