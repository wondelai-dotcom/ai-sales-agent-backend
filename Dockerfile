FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
# Schema changes must be applied by an explicit, reviewed deployment step.
# Never mutate the production schema automatically during container startup.
CMD ["node", "dist/server.js"]
