FROM node:20-alpine

WORKDIR /app

# Paket listelerini kopyala
COPY package.json package-lock.json* ./

# Bağımlılıkları kur (Cache avantajı sağlar)
RUN npm install

# Geri kalan dosyaları kopyala
COPY . .

EXPOSE 3000

# Next.js dev server'ı başlat
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
