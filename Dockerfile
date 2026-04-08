FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN apk add --no-cache libc6-compat
RUN npm install --legacy-peer-deps

ARG GEMINI_API_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY . .
RUN npm run build

EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
