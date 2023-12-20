# AnnAngela/eslint-formatter-gha

A better ESLint formatter used in GitHub Actions. It can help you to get more human-readable annotation from ESLint. See screenshoots below:

![Secreenshoot 1](https://github.com/AnnAngela/eslint-formatter-gha/assets/9762652/adc092d1-c2ca-44bd-b14e-59f561162e7d)

![Secreenshoot 2](https://github.com/AnnAngela/eslint-formatter-gha/assets/9762652/e6d8792d-dec1-48e6-bee5-06aee1c88153)

Thess secreenshoots are taken with configuration `ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY` as `notice`, so you can see the deprecated rules infomation in Annotation and Summary.

## Installation

Run this command:

```shell
npm install --save-dev @AnnAngela/eslint-formatter-gha
```

## Usage

Add [`-f @AnnAngela/eslint-formatter-gha` or `--format @AnnAngela/eslint-formatter-gha`](https://eslint.org/docs/latest/use/command-line-interface#-f---format) to your eslint command, like this:

```shell
npx eslint -f @AnnAngela/eslint-formatter-gha src
```

## Configuration

You can use these **environment variables** to configure the formatter:

* `ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY`:

  Valid value is `debug` (default in v1), `notice`, `warning`, `error`.

  If the value is `debug`, the report of the deprecated rules will be only logged as debug log, which you have to enable [debug logging](https://docs.github.com/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging) to see it.

## Upcoming v2

According to [the blog "Deprecation of formatting rules"](https://eslint.org/blog/2023/10/deprecating-formatting-rules/) and [the release note of ESLint v8.53](https://eslint.org/blog/2023/11/eslint-v8.53.0-released/), a batch of formatting rules have been marked as deprecated in documents.

But in the cli, the deprecation of the rules is only visible after v9. So the default value of environment variable `ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY` will remain as `debug` until ESLint v9 is released, to prevent unexpected large amounts of log output.

After that, the default value will be changed to `notice` with the v2 major release of this package.
