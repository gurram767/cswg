# Playwright image ships with browsers + OS deps preinstalled.
# Tag is pinned to the @playwright/test version in package-lock.json.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the test framework.
# (data/users.json and other secrets are excluded via .dockerignore and
#  are mounted at runtime instead of baked into the image.)
COPY . .

# CI-friendly defaults; override at runtime with -e / docker-compose.
ENV CI=true \
    HEADLESS=true \
    DATA_SOURCE=json \
    BASE_URL=https://qacsconnect.cswg.com

CMD ["npm", "run", "test:ci"]
