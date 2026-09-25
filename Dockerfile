# quilt-loom — the Divergence Foundry, containerized.
# The offline run is fully deterministic: no keys, no network, same verdicts.
FROM node:24-alpine
WORKDIR /loom
COPY package.json ./
COPY loom ./loom
COPY smoke.mjs run_offline.mjs ./
RUN npm install --no-save yaml || true
CMD ["node", "run_offline.mjs"]
