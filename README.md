# wiw-events-shifts-display

This project got started from the Electron quick start: https://github.com/electron/electron-quick-start

This project was developed at the [University of Washington](uw.edu).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Install dependencies
npm install
# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Updates

Dependency updates: update the base image in `Dockerfile` and update application dependencies in `package.json`.

### Base Image

[Base image list](https://www.balena.io/docs/reference/base-images/base-images/) - Choose a recent linux / node version that also supports the selected version of Electron.

### Electron Updates

Note: build depends on there being a prebuilt ARM architecture version of electron that can be downloaded during package install. For newer versions of electron, these are not always available. The build will fail if the necessary files are not acquired.

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## License

[MIT](LICENSE)
