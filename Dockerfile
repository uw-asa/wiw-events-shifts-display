# This dockerfile is specifically generated to target a raspberry pi platform and will not run on different host architectures

FROM balenalib/raspberrypi3-ubuntu-node:12.14-bionic

# Avoid debconf from asking about keyboard config - there is no keyboard - set debconf to noninteractive
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
  apt-utils \
  clang \
  xserver-xorg-core \
  xserver-xorg-input-all \
  xserver-xorg-video-fbdev \
  xorg \
  libxcb-image0 \
  libxcb-util1 \
  xdg-utils \
  libdbus-1-dev \
  libgtk2.0-dev \
  libnotify-dev \
  libgnome-keyring-dev \
  libgconf2-dev \
  libasound2-dev \
  libcap-dev \
  libcups2-dev \
  libxtst-dev \
  libxss1 \
  libnss3-dev \
  libsmbclient \
  libssh-4 \
  fbset \
  libexpat-dev \
  libraspberrypi-bin \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Set local timezone for device
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Set Xorg and FLUXBOX preferences
RUN mkdir ~/.fluxbox
RUN echo "xset s off" > ~/.fluxbox/startup && echo "xserver-command=X -s 0 dpms" >> ~/.fluxbox/startup
RUN echo "#!/bin/bash" > /etc/X11/xinit/xserverrc \
  && echo "" >> /etc/X11/xinit/xserverrc \
  && echo 'exec /usr/bin/X -s 0 dpms -nocursor -nolisten tcp "$@"' >> /etc/X11/xinit/xserverrc

# Move package.json to filesystem
COPY ./package.json .

RUN npm install && npm cache clean --force && rm -rf /tmp/*

# Test to ensure that electron was installed by checking if the electron binaries were downloaded to the /dist/ folder
RUN test -d "./node_modules/electron/dist/" || exit 1

COPY . .
## uncomment if you want systemd
ENV INITSYSTEM on

# Workarounds for dealing with chromium's sandbox requirements. This (below) didn't seem to work, but setting "--no-sandbox" on the start script did
# https://github.com/electron/electron/issues/17972 
# RUN chmod 4755 node_modules/electron/dist/chrome-sandbox

# Start app
CMD ["bash", "/usr/src/app/start.sh"]