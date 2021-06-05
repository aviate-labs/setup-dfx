# Setup The Internet Computer SDK

This action sets up a dfx environment, also includes `moc`.

## Usage

```yml
steps:
- uses: actions/checkout@v2
- uses: allusion-be/setup-dfx@main
  with:
    dfx-version: 0.7.1
- run: |
    dfx --version
    moc --version
```

## Possible Improvements

1. Make use of the [manifest.json](https://sdk.dfinity.org/manifest.json) to check versions.
2. The path is currently always `/home/runner/...`, is there a better way to do this?
3. Include `base` modules in the `moc` command.
   (i.e. `moc --package base $(dfx cache show)/base`)

## License
The scripts and documentation in this project are released under the [MIT License](./LICENSE).
