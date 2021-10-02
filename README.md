# Setup The Internet Computer SDK

This action sets up a dfx environment, also includes `moc` and `vessel`.

**!** Only supports Ubuntu virtual environments.

## Usage

```yml
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v2
- uses: aviate-labs/setup-dfx@v0.2.3
  with:
    vessel-version: 0.6.2
- run: for i in src/*.mo ; do $(vessel bin)/moc $(vessel sources) --check $i ; done
```

### Deploying

```yml
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v2
- uses: aviate-labs/setup-dfx@v0.2.3
  with:
    dfx-version: 0.8.1
  env:
    DFX_IDENTITY_PEM: ${{ secrets.DFX_IDENTITY_PEM }}
- run: |
    dfx identity use action
    dfx deploy --network ic --no-wallet
```

## Possible Improvements

- Make use of the [manifest.json](https://sdk.dfinity.org/manifest.json) to check versions.

## License

The scripts and documentation in this project are released under the [MIT License](./LICENSE).
