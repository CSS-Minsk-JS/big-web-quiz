The repo is a [fork](https://github.com/poalrom/big-web-quiz) from [Big Web Quiz](https://github.com/jakearchibald/big-web-quiz)

# Development && Deploy

## Prerequisites

* Node >= 6.7.0
* Docker >= 1.12.1

And `server/settings.js` should look like:

```js
export const cookieSecret = '';

// Google oauth
export const clientId = '';
export const clientSecret = '';
export const redirectOrigin = '';
```

…but with the correct values.

## To install

```sh
npm install # or yarn
```
And don't forget to run mongodb

## To local development

```sh
# build docker image
npm run docker-build
# run app on 1414 port and mount current dir into image
npm run dev
```

Then if you change anything in project localy, it will change in image and trigger rebuild

**Google oauth not work locally!**

In local docker based development env variable `LOCAL` enabled by default.
It enable login via username and allow using admin panel for user with login `admin`.

## To run

```sh
npm run serve
```

## Dokku setup

1. Install Dokku
2. Use vhosts, then:

```sh
sudo dokku plugin:install https://github.com/dokku/dokku-mongo.git mongo
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
sudo dokku apps:create big-web-quiz
sudo dokku mongo:create big-web-quiz
sudo dokku mongo:link big-web-quiz big-web-quiz
sudo dokku domains:add big-web-quiz bigwebquiz.com
sudo dokku domains:remove big-web-quiz big-web-quiz.bigwebquiz.com
sudo dokku config:set --no-restart big-web-quiz DOKKU_LETSENCRYPT_EMAIL=jaffathecake@gmail.com
# then push the app (yarn run deploy), then:
sudo dokku letsencrypt big-web-quiz
sudo dokku letsencrypt:cron-job --add
```

Then up the connection limits in `/etc/nginx/nginx.conf`.

```
worker_rlimit_nofile 90000;

events {
        worker_connections 90000;
        # multi_accept on;
}
```

…then restart nginx.