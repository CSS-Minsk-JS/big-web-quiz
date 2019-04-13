FROM ubuntu:latest

RUN apt-get update && apt-get -y upgrade && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install bash git nodejs npm gnupg2

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

RUN echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-4.0.list

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y mongodb

EXPOSE 3000

ENV LOCAL=true

WORKDIR /var/www/site

COPY . /var/www/site
RUN mkdir -p /data/db

RUN npm install

CMD mongod & npm run serve & /bin/bash