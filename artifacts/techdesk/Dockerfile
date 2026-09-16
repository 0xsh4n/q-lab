FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/techdesk/package.json artifacts/techdesk/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @workspace/techdesk run build

FROM nginx:1.27-alpine
COPY --from=build /app/artifacts/techdesk/dist/public /usr/share/nginx/html
EXPOSE 4173
CMD ["nginx", "-g", "daemon off;"]
