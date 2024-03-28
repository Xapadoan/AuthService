FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY tsconfig.json .

RUN mkdir ./service
COPY service/package.json ./service
COPY service/tsconfig.build.json ./service

RUN npm install
RUN npm i --save-dev typescript tsc-alias

COPY service/src service/src

WORKDIR /app/service


RUN npx tsc --build /app/service/tsconfig.build.json && npx tsc-alias -p /app/service/tsconfig.build.json

CMD ["NODE_ENV=production", "node", "dist/index.js"]
