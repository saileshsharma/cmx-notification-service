FROM node:20-alpine AS build
WORKDIR /app
COPY package.json angular.json tsconfig*.json ./
COPY src ./src
RUN npm install
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/cmx-surveyor-calendar-ui/browser /usr/share/nginx/html
EXPOSE 80
