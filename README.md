# ⚖️ Legal AI

> **Advanced Legal Intelligence Workspace** powered by Retrieval‑Augmented Generation (RAG), Hybrid Semantic Search, and Local/Cloud LLM orchestration.

---

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Next.js-15%2F16-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/OpenSearch-2.12-005EB8?style=for-the-badge&logo=opensearch&logoColor=white" alt="OpenSearch" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/CUDA-Accelerated-76B900?style=for-the-badge&logo=nvidia&logoColor=white" alt="CUDA" />
</p>

---

## 📖 Proje Hakkında

**Legal AI**, hukuk büroları ve avukatlar için özel olarak tasarlanmış, yapay zeka destekli bir yasal asistan platformudur. Belgelerinizi otomatik olarak tarar, indeksler ve **Hibrit Arama (Dense Vector + Lexical Search)** sayesinde en doğru bilgileri saniyeler içinde çıkararak RAG (Retrieval‑Augmented Generation) akışı ile sorularınızı yanıtlar.

---

## ✨ Öne Çıkan Özellikler

| Özellik                            | Açıklama                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------ |
| 🔍 **Hibrit Semantic Search (RAG)** | `intfloat/multilingual-e5-large` vektör modeli + OpenSearch entegrasyonu |
| 🤖 **LLM Orkestrasyonu**            | Bulut (OpenAI) ve yerel (Ollama) modeller arasında geçiş                 |
| 🛡️ **Gelişmiş RBAC**                | Admin / User rolleri için RoleGuard HOC ve API korumaları                |
| ⚡ **CUDA Hızlandırması**           | GPU destekli local modeller için milisaniye seviyesinde yanıt            |
| 📈 **Gerçek Zamanlı Analitik**      | Sorgu istatistikleri, token tüketimi ve doğruluk oranları paneli         |

---

## 🏗️ Sistem Mimarisi & Veri Akışı

```mermaid
graph TD
    User([⚖️ Avukat / Kullanıcı]) -->|HTTPS / UI| FE[💻 Next.js Frontend]
    FE -->|REST API / JSON| BE[⚙️ FastAPI Backend]
    subgraph Core Services
        BE -->|Metadata & Log| DB[(🐘 PostgreSQL 15)]
        BE -->|Hybrid Vector Search| OS[(🔍 OpenSearch)]
    end
    subgraph AI Layer
        BE -->|Embedding / Local LLM| HF[🤗 HuggingFace / PyTorch]
        BE -->|Cloud LLM| OAI[🤖 OpenAI / Ollama]
    end
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style FE fill:#85C1E9,stroke:#333,stroke-width:2px
    style BE fill:#82E0AA,stroke:#333,stroke-width:2px
    style DB fill:#F5B041,stroke:#333,stroke-width:2px
    style OS fill:#F5B041,stroke:#333,stroke-width:2px
    style HF fill:#BB8FCE,stroke:#333,stroke-width:2px
    style OAI fill:#BB8FCE,stroke:#333,stroke-width:2px
```

---

## 🛠️ Teknoloji Yığını

| Katman        | Teknoloji                                             | Açıklama                                         |
| ------------- | ----------------------------------------------------- | ------------------------------------------------ |
| **Frontend**  | Next.js 15/16 (App Router) • TypeScript • TailwindCSS | SEO‑dostu, responsive modern panel               |
| **Backend**   | FastAPI (Python 3.10+) • SQLAlchemy                   | Asenkron, yüksek performanslı REST API           |
| **RDBMS**     | PostgreSQL 15                                         | Kullanıcı rolleri, doküman meta ve log kayıtları |
| **Vektör DB** | OpenSearch 2.12                                       | Büyük ölçekli metin indeksleme & vektör arama    |
| **AI / ML**   | PyTorch • Transformers • OpenAI / Ollama              | `multilingual-e5-large` ve büyük dil modelleri   |
| **Container** | Docker • Docker‑Compose                               | Taşınabilir, hızlı dağıtım                       |

---

## 🚀 Hızlı Başlangıç

### 📋 Ön Gereksinimler

- **Docker** & **Docker‑Compose** (GPU desteği için NVIDIA Container Toolkit) 
- **Python 3.10+** (lokal geliştirme) 
- **Node.js 20+** (frontend) 

### ⚙️ Docker ile Tek Tıkla Çalıştırma (Önerilen)

```bash
# .env şablonunu kopyala
cp .env.example .env

# CPU Modu (GPU yok)
sed -i 's/LLM_DEVICE=.*/LLM_DEVICE=cpu/' .env
make docker-up   # ya da: docker compose up --build -d

# GPU Modu (CUDA destekli)
sed -i 's/LLM_DEVICE=.*/LLM_DEVICE=cuda/' .env
make docker-up-gpu   # ya da: docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d
```

Durdurmak için:
```bash
make docker-down   # ya da: docker compose down
```

### 🖥️ Yerel Geliştirme (Local Dev)

```bash
# Bağımlılıkları kur
make setup

# OpenSearch ve PostgreSQL konteynerlerini başlat
make start-opensearch   # (PostgreSQL zaten Compose içinde)

# Backend'i çalıştır
make run-backend   # http://localhost:8000

# Frontend'i çalıştır
make run-frontend   # http://localhost:3000
```

---

## 📂 Proje Dizin Yapısı

```
legal-ai/
├─ backend/                # FastAPI sunucu & RAG pipeline
│   ├─ app/
│   │   ├─ api/          # API route katmanları (auth, docs, search)
│   │   ├─ core/         # Konfigürasyon, güvenlik, DB bağlantısı
│   │   ├─ models/       # SQLAlchemy şema tanımları
│   │   ├─ services/     # LLM, embedding, OpenSearch servisleri
│   │   └─ main.py       # Sunucu giriş noktası
│   ├─ Dockerfile
│   └─ requirements.txt
├─ frontend-next/          # Next.js UI
│   ├─ src/
│   │   ├─ app/          # Dashboard, Analytics, Settings (App Router)
│   │   ├─ components/   # Yeniden kullanılabilir UI & RoleGuard
│   │   └─ proxy.ts      # API proxy
│   ├─ Dockerfile
│   └─ package.json
├─ sql/                    # DB şema & seed verileri
├─ docker-compose.yml
├─ docker-compose.gpu.yml
├─ Makefile                # Kısayol komutları
├─ .env.example            # Ortam değişkenleri şablonu
└─ README.md               # 📄 Bu dokümantasyon
```

---

## 📚 API Dokümantasyonu

Docker konteynerleri çalıştıktan sonra aşağıdaki adreslerden API’yi keşfedebilirsiniz:

- **Frontend**: <http://localhost:3000>
- **FastAPI Swagger**: <http://localhost:8000/docs>
- **OpenSearch Dashboard**: <http://localhost:5601> (monitoring aktifse)

---

## 🛡️ Güvenlik ve Üretim Önerileri

- `.env` dosyasındaki `SECRET_KEY`, `POSTGRES_PASSWORD` ve `OPENSEARCH_ADMIN_PASSWORD` değerlerini **güçlü, benzersiz** şifrelerle değiştirin.
- `.env` hiçbir zaman Git reposuna commit edilmemelidir. `.gitignore` içinde `.env` ekli olduğundan emin olun.
- Production ortamına geçmeden önce **HTTPS** terminalleri, **rate limiting** ve **audit logging** yapılandırmalarını gözden geçirin.

---

## 🤝 Katkıda Bulunma

1. Fork yapın ve yeni bir branch oluşturun (`git checkout -b feature/awesome-feature`).
2. Değişikliklerinizi test edin (`make test` – test altyapısı gelecekte eklenecek).
3. Pull‑request gönderin ve kod incelemesi bekleyin.

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

---

## 🙏 Teşekkürler

Bu projeyi hayata geçiren **Legal AI Developer Team**’e ❤️.

---

<p align="center">
  Made with ❤️ by the Legal AI Developer Team.
</p>
