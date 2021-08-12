FROM node:14-alpine as react-build

WORKDIR /app
COPY . ./
RUN yarn
RUN yarn build

FROM node:14-buster-slim
WORKDIR /app
COPY --from=react-build /app/packages/backend/dist/skeleton.tar.gz /app/package.json ./
COPY --from=react-build /app/packages/app/package.json ./packages/app/package.json
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"

COPY --from=react-build /app/packages/backend/dist/bundle.tar.gz /app/app-config.yaml ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

CMD ["node", "packages/backend", "--config", "app-config.yaml"]
