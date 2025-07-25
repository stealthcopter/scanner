<div align="center">
  <img width="1000" alt="image" src="https://github.com/caido-community/.github/blob/main/content/banner.png?raw=true">

  <br />
  <br />
  <a href="https://github.com/caido-community" target="_blank">Github</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://developer.caido.io/" target="_blank">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://links.caido.io/www-discord" target="_blank">Discord</a>
  <br />
  <hr />
</div>

# Scanner

A web vulnerability scanner plugin for Caido.

### About Scanner

Scanner is a vulnerability detection plugin that brings automated security testing capabilities to Caido. Scanner provides a user-friendly interface for identifying common web application vulnerabilities.

https://github.com/caido-community/scanner/raw/refs/heads/main/assets/demo.mp4

## 🚀 Getting Started

### Installation [Recommended]

1. Open Caido, navigate to the `Plugins` sidebar page and then to the `Community Store` tab
2. Find `Scanner` and click Install
3. Done! 🎉

### Installation [Manual]

1. Go to the [Scanner Releases tab](https://github.com/caido-community/scanner/releases) and download the latest `plugin_package.zip` file
2. In your Caido instance, navigate to the `Plugins` page, click `Install` and select the downloaded `plugin_package.zip` file
3. Done! 🎉


## 🔧 Adding Custom Checks

Scanner's modular architecture makes it easy to add new vulnerability checks:

1. Create a new check in [packages/backend/src/checks/](https://github.com/caido-community/scanner/tree/main/packages/backend/src/checks)
2. Register the check in the main checks [index file](https://github.com/caido-community/scanner/blob/main/packages/backend/src/checks/index.ts)


## 💚 Community

Join our [Discord](https://links.caido.io/www-discord) community and connect with other Caido users! Share your ideas, ask questions, and get involved in discussions around Caido and security testing.

## 🤝 Contributing

Feel free to contribute! If you'd like to request a feature or report a bug, please create a [GitHub Issue](https://github.com/caido-community/scanner/issues/new).
