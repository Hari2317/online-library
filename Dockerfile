# Build frontend
FROM node:20 as frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Backend
FROM node:20

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend ./backend

# Vite output folder
COPY --from=frontend-build /app/frontend/dist ./backend/public

WORKDIR /app/backend

EXPOSE 8000

CMD ["npm", "start"]