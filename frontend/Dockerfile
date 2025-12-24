FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist/cmx-surveyor-calendar-ui/browser ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
