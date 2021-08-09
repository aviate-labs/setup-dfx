# Setup The Internet Computer SDK

This action sets up a dfx environment, also includes `moc`.

**!** Only supports Ubuntu virtual environments.

## Usage

```yml
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v2
- uses: aviate-labs/setup-dfx@v0.2.2
  with:
    dfx-version: 0.7.1
    vessel-version: 0.6.1
- run: |
    dfx --version
    moc --version
    vessel --version
```

### Deploying

```yml
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v2
- uses: aviate-labs/setup-dfx@v0.2.2
  with:
    dfx-version: 0.7.2
    install-moc: false
  env:
    DFX_IDENTITY_PEM: ${{ secrets.DFX_IDENTITY_PEM }}
- run: |
    dfx identity use action
    dfx deploy --network ic --no-wallet
```

## Possible Improvements

1. Make use of the [manifest.json](https://sdk.dfinity.org/manifest.json) to check versions.
2. The path is currently always `/home/runner/...`, is there a better way to do this?
3. Include `base` modules in the `moc` command.
   (i.e. `moc --package base $(dfx cache show)/base`)

## License
The scripts and documentation in this project are released under the [MIT License](./LICENSE).
