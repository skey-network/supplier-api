FROM node:14.4.0

WORKDIR /app

COPY package.json /app/package.json

RUN npm install

ADD . /app

RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main"]
