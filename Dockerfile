FROM node:14.4.0

WORKDIR /app

COPY package.json /app/package.json

RUN npm install

ADD . /app

VOLUME /var/volume/

RUN npm run build

CMD ["node", "dist/main"]
