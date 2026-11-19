# SPDX-License-Identifier: AGPL-3.0-only
# Remote-mode image for one instance behind a TLS-terminating proxy. See docs/HOSTING.md.
FROM node:24-slim
ENV NODE_ENV=production \
    PORT=3218 \
    GATEWAY_ALLOW_REMOTE=1 \
    GATEWAY_LISTEN_HOST=0.0.0.0 \
    GATEWAY_TRUST_PROXY_HOPS=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY LICENSE openapi.yaml ./
COPY src ./src
USER node
EXPOSE 3218
HEALTHCHECK --interval=30s --timeout=3s CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "src/server.js"]
