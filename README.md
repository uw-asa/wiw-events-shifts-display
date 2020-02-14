# wiw-events-shifts-display

Digital signage for displaying events and shifts with data from When I Work or EMS APIs.

This project was developed at the [University of Washington](uw.edu). Users outside of our organization will likely need to go through some significant configuration steps in order to make this code work for them. It's presented here as (hopefully!) a good jumping-off point.

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Install dependencies
npm install
# Run the app
npm start
```

Settings, secrets, etc. will be loaded from local environment variables. See [Configuration](#Configuration) for necessary setup steps for running locally, or what options are available for running in a managed environment.

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

### Configuration

Sample configuration file provided in `sample.env`

- `DISPLAY_CORNER_TITLE=WIW and EMS Display`

  Sets the display title in the corner of the screen. Defaults to 'Events Display'.

- `WIW_API_TOKEN=when-i-work-login-token`

  Sets the login token for the When I Work API. Necessary to load any data from When I Work.

- `WIW_API_URL=https://api.wheniwork.com/2/`

  Base URL for When I Work's API. Shouldn't change too much.

- `NOTES_TITLE_SEPARATOR=-`

  Titles for events are in the notes for shifts in When I Work for our particular environment. This is subject to change, and thus the separator can be configured. Works in concert with `SEPARATOR_WHITESPACE`.

- `SEPARATOR_WHITESPACE=true`

  Configures whether or not the separator is surrounded by whitespace or not. In this example the above separator would be a dash surrounded by whitespace.

- `WIW_API_LOCATION=123456`

  API Location ID to search When I Work for shift data. Can be set to a comma-delimited list, such as `123456,234567,345678` to get shifts for multiple locations at once.

- `WIW_LOOKAHEAD_DAYS=5`

  How many days worth of data to query from the API each time. Defaults to 7.

- `EMS_LOOKAHEAD_DAYS=5`

  How many days worth of data to query from the API each time. Defaults to 7.

- `MAX_REFRESH_INTERVAL=300`

  Seconds. Program will refetch data every 30 seconds by default. If any errors occur, including network issues, the refetch rate will slow down by 30 seconds per error until a successful cycle passes, at which point it will return to the default initial refetch rate. The maximum refetch rate puts an upper limit to this rate, so that it will at most wait 5 minutes between attempts.

- `EMS_API_USER=username`

  Username to pass to EMS for accessing the API.

- `EMS_API_PASS=password`

  Password to pass to EMS for accessing the API.

- `EMS_API_URL=https://base.url/EMSAPI/`

  Root URL for the EMSAPI.

- `EMS_BUILDINGS=1,2,3,4`

  Building IDs in EMS to gather booking / event data for.

- `EMS_STATUSES=2,3,4,5`

  Status IDs in EMS to gather booking / event data for.

- `EMS_EVENT_TYPES=1,2,3,4,5,6,7,8,9`

  Event Type IDs in EMS to gather booking / event data for.

- `DISPLAY_RENDER_MODE_LEFT=EVENTS`
- `DISPLAY_RENDER_MODE_RIGHT=EVENTS`

  options for DISPLAY_RENDER_MODEs: "LABOR", "EVENTS", or "EMS-EVENTS"

  - LABOR = When I Work Labor (condensed view)
  - EVENTS = When I Work labor events associated with an event
  - EMS-EVENTS = Events scheduled in EMS (regardless of labor assignment)

  When both Left and Right render modes are the same, the screen will render data across both columns (top to bottom, left to right). When the settings are different, each column will render it's data in the set column only (top-to-bottom).

- `DISPLAY_LEFT_COLUMN_TITLE=WIW Events Labor`
- `DISPLAY_RIGHT_COLUMN_TITLE=EMS Event List`

  When showing two separate columns of data (render modes for left and right are different) use these options to set the column header text.

## Updates

Dependency updates: update the base image in `Dockerfile` and update application dependencies in `package.json`.

### Base Image

[Base image list](https://www.balena.io/docs/reference/base-images/base-images/) - Choose a recent linux / node version that also supports the selected version of Electron.

### Electron Version Updates

Note: build depends on there being a prebuilt ARM architecture version of electron that can be downloaded during package install. For newer versions of electron, these are not always available. The build will fail if the necessary files are not acquired.

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron API

This project got started from the Electron quick start: https://github.com/electron/electron-quick-start

## License

[MIT](LICENSE)
