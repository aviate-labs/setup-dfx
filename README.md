# Setup The Internet Computer SDK

This action sets up a `dfx` environment, also includes `moc`, `vessel` and `pocket-ic`.

**!** Only supports Ubuntu/macOS virtual environments.

## Usage

```yml
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- uses: aviate-labs/setup-dfx@v0.3.2
  with:
    vessel-version: 0.7.0
- run: for i in src/*.mo ; do $(vessel bin)/moc $(vessel sources) --check $i ; done
```

### Deploying

```yml
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- uses: aviate-labs/setup-dfx@v0.3.2
  with:
    dfx-version: 0.18.0
  env:
    DFX_IDENTITY_PEM: ${{ secrets.DFX_IDENTITY_PEM }}
- run: |
    dfx identity use action
    dfx deploy --network ic --no-wallet
```

## License

The scripts and documentation in this project are released under the [MIT License](./LICENSE).
