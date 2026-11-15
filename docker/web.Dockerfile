FROM node:24-slim
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .

EXPOSE 3001
CMD ["npm", "run", "dev", "-w", "apps/web", "--", "--host", "0.0.0.0"]