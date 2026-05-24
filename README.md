# ⚖️ Legal AI

> **Advanced Legal Intelligence Workspace** powered by Retrieval‑Augmented Generation (RAG), Hybrid Semantic Search, and Cloud-Native OpenAI Embedding & LLM Orchestration.

---

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Next.js-15%2F16-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/OpenSearch-2.12-005EB8?style=for-the-badge&logo=opensearch&logoColor=white" alt="OpenSearch" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

---

## 📖 Proje Hakkında

**Legal AI**, hukuk büroları ve avukatlar için özel olarak tasarlanmış, yapay zeka destekli ultra hafif ve modern bir yasal asistan platformudur. Belgelerinizi otomatik olarak tarar, indeksler ve **Hibrit Arama (Dense Vector + Lexical Search)** sayesinde en doğru bilgileri saniyeler içinde çıkararak RAG (Retrieval‑Augmented Generation) akışı ile sorularınızı yanıtlar.

Lokal makinenizi yoran ağır PyTorch, Hugging Face ve `sentence-transformers` gibi kütüphanelere ihtiyaç duymadan, gücünü tamamen **OpenAI API (text-embedding-3-small)** ve OpenSearch entegrasyonundan alır.

---

## ✨ Öne Çıkan Özellikler

| Özellik                             | Açıklama                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------- |
| 🔍 **Hibrit Semantic Search (RAG)** | OpenAI `text-embedding-3-small` (1536 dim) + OpenSearch BM25 entegrasyonu |
| 🤖 **Hafif & Cloud-Native**         | Lokal makinede GPU veya PyTorch bağımlılığı gerektirmeyen hafif mimari    |
| 🛡️ **Gelişmiş RBAC**                | Admin / User rolleri için RoleGuard HOC ve API korumaları                 |
| 📈 **Gerçek Zamanlı Analitik**      | Sorgu istatistikleri, token tüketimi ve doğruluk oranları paneli          |
| 📂 **Belge Yönetimi**               | PDF, DOCX, HTML yükleme; otomatik chunking ve vektör indeksleme           |
| 🔐 **JWT Kimlik Doğrulama**         | Güvenli oturum yönetimi; refresh token desteği                            |
| ⚡ **Milisaniye Seviyesinde Yanıt**  | Hafifletilmiş arama hattı sayesinde anlık RAG yanıtları                  |

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
        BE -->|Embeddings & LLM| OAI[🤖 OpenAI API]
        BE -->|Local LLM Option| OLL[🤖 Ollama]
    end
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style FE fill:#85C1E9,stroke:#333,stroke-width:2px
    style BE fill:#82E0AA,stroke:#333,stroke-width:2px
    style DB fill:#F5B041,stroke:#333,stroke-width:2px
    style OS fill:#F5B041,stroke:#333,stroke-width:2px
    style OAI fill:#BB8FCE,stroke:#333,stroke-width:2px
    style OLL fill:#BB8FCE,stroke:#333,stroke-width:2px
```

---

## 🛠️ Teknoloji Yığını

| Katman        | Teknoloji                                              | Açıklama                                          |
| ------------- | ------------------------------------------------------ | ------------------------------------------------- |
| **Frontend**  | Next.js 15/16 (App Router) • TypeScript • TailwindCSS  | SEO‑dostu, responsive modern panel                |
| **Backend**   | FastAPI (Python 3.10+) • SQLAlchemy • Alembic          | Asenkron, yüksek performanslı REST API            |
| **RDBMS**     | PostgreSQL 15                                          | Kullanıcı rolleri, doküman meta ve log kayıtları  |
| **Vektör DB** | OpenSearch 2.12                                        | Büyük ölçekli metin indeksleme & vektör arama     |
| **AI / ML**   | OpenAI API (text-embedding-3-small) • Ollama           | Bulut tabanlı embedding ve büyük dil modelleri    |
| **Container** | Docker • Docker‑Compose                                | Taşınabilir, hızlı dağıtım                        |

---

## 🚀 Hızlı Başlangıç

### 📋 Ön Gereksinimler

- **Docker** & **Docker‑Compose** v2+
- **Python 3.10+** (lokal geliştirme için)
- **Node.js 20+** (frontend geliştirme için)
- **OpenAI API Key** (Embedding ve LLM kullanımı için)

### ⚙️ Docker ile Tek Tıkla Çalıştırma (Önerilen)

```bash
# 1. .env şablonunu kopyala ve düzenle
cp .env.example .env
nano .env   # en az OPENAI_API_KEY ve SECRET_KEY'i gir

# 2. Servisleri Başlat (Ağır ML modelleri olmadığından anında ayağa kalkar)
docker compose up --build -d
# ya da Makefile ile: make docker-up
```

Durdurmak için:
```bash
docker compose down          # servisleri durdur
docker compose down -v       # servisleri + volume'ları temizle
# ya da: make docker-down
```

### 🖥️ Yerel Geliştirme (Local Dev)

```bash
# 1. Bağımlılıkları kur (backend venv + frontend node_modules)
make setup

# 2. Altyapı servislerini başlat (OpenSearch, PostgreSQL)
docker compose up postgres opensearch -d

# 3. OpenSearch İndeksini Recreate Et (1536 dim - text-embedding-3-small için)
backend/venv/bin/python scripts/build_index.py

# 4. Backend'i çalıştır
make run-backend   # http://localhost:8000

# 5. Frontend'i çalıştır (ayrı terminalde)
make run-frontend  # http://localhost:3000
```

---

## 🔑 Ortam Değişkenleri

`.env.example` dosyasını kopyalayarak `.env` oluşturun. Kritik değişkenler:

| Değişken                    | Açıklama                                              | Örnek / Varsayılan                        |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| `SECRET_KEY`                | JWT imzalama anahtarı — **mutlaka değiştirin**        | `openssl rand -hex 64` çıktısı            |
| `OPENAI_API_KEY`            | OpenAI API erişim anahtarı                            | `sk-...`                                  |
| `POSTGRES_USER`             | PostgreSQL kullanıcı adı                              | `postgres`                                 |
| `POSTGRES_PASSWORD`         | PostgreSQL şifresi — **mutlaka değiştirin**           | `postgres`                             |
| `POSTGRES_DB`               | Veritabanı adı                                        | `legalai`                              |
| `OPENSEARCH_ADMIN_PASSWORD` | OpenSearch admin şifresi — **mutlaka değiştirin**     | `StrongLegalAI2026_SecurePassword!`       |
| `OPENSEARCH_INDEX`          | Belge vektörlerinin saklandığı indeks adı             | `legal_chunks`                            |
| `EMBEDDING_MODEL`           | Kullanılacak OpenAI embedding modeli                  | `text-embedding-3-small`                  |
| `EMBEDDING_DIM`             | Embedding vektör boyutu (OpenAI small için 1536)      | `1536`                                    |
| `LLM_MODEL`                 | Kullanılacak OpenAI modeli                            | `gpt-4o`                                  |
| `CORS_ORIGINS`              | İzin verilen frontend origin'leri (virgülle ayrılmış) | `["http://localhost:3000"]`               |

> **Not:** Tüm değişkenlerin tam listesi için `.env.example` dosyasına bakın.

---

## 📂 Proje Dizin Yapısı

```
legal-ai/
├─ backend/                 # FastAPI sunucu & RAG pipeline
│   ├─ app/
│   │   ├─ api/            # Route katmanları (auth, docs, search, admin)
│   │   ├─ core/           # Konfigürasyon, güvenlik, DB bağlantısı
│   │   ├─ models/         # SQLAlchemy şema tanımları
│   │   ├─ services/       # LLM, embedding, OpenSearch servisleri
│   │   ├─ vectorstore/    # OpenSearch istemcisi & indeks yönetimi
│   │   └─ main.py         # Uygulama giriş noktası
│   ├─ Dockerfile
│   └─ requirements.txt
├─ frontend-next/           # Next.js 15 (App Router) UI
│   ├─ src/
│   │   ├─ app/            # Dashboard, Analytics, Cases, Settings
│   │   ├─ components/     # Yeniden kullanılabilir UI & RoleGuard HOC
│   │   ├─ lib/            # API istemcisi & yardımcı fonksiyonlar
│   │   └─ types/          # TypeScript tip tanımları
│   ├─ Dockerfile
│   └─ package.json
├─ sql/                     # DB şema (DDL) & seed verileri
├─ infra/                   # Altyapı konfigürasyonları (OpenSearch, Nginx)
├─ scripts/                 # Yardımcı otomasyon/indeksleme scriptleri
├─ data/                    # Örnek hukuki dokümanlar ve test verileri
├─ docker-compose.yml       # Temel servis tanımları
├─ Makefile                 # Kısayol komutları
├─ .env.example             # Ortam değişkenleri şablonu
├─ LICENSE                  # MIT Lisansı
└─ README.md                # 📄 Bu dokümantasyon
```

---

## 📚 API Dokümantasyonu

Konteynerler ayağa kalktıktan sonra:

| Servis               | URL                                      |
| -------------------- | ---------------------------------------- |
| **Frontend UI**      | <http://localhost:3000>                  |
| **FastAPI Swagger**  | <http://localhost:8000/docs>             |
| **FastAPI ReDoc**    | <http://localhost:8000/redoc>            |
| **OpenSearch Dash.** | <http://localhost:5601> *(monitoring)*   |

Temel endpoint'ler:

```
POST   /api/v1/auth/login          # Kullanıcı girişi → JWT token
POST   /api/v1/auth/register       # Yeni kullanıcı kaydı
GET    /api/v1/documents           # Yüklü belgeleri listele
POST   /api/v1/documents/upload    # Belge yükle & indeksle
POST   /api/v1/search/query        # RAG tabanlı soru-cevap
GET    /api/v1/analytics/stats     # Token & sorgu istatistikleri
GET    /api/v1/admin/users         # Kullanıcı yönetimi (admin)
```

---

## 🛡️ Güvenlik ve Üretim Önerileri

- `.env` içindeki `SECRET_KEY`, `POSTGRES_PASSWORD` ve `OPENSEARCH_ADMIN_PASSWORD` değerlerini **güçlü, benzersiz** şifrelerle değiştirin.
- `.env` dosyası **kesinlikle Git reposuna commit edilmemelidir**. `.gitignore` dosyasında `.env` satırının bulunduğunu doğrulayın.
- Production ortamında HTTPS terminali (Nginx / Traefik), **rate limiting** ve **audit logging** yapılandırmalarını etkinleştirin.
- `docker-compose.yml`'deki `--reload` flag'ini production'da kaldırın.
- Düzenli olarak `docker compose pull` komutu ile baz imajları güncelleyin.

---

## 🤝 Katkıda Bulunma

Katkılarınız memnuniyetle karşılanır! Lütfen aşağıdaki adımları izleyin:

1. Bu repoyu **fork** edin.
2. Feature branch'i oluşturun (`git checkout -b feature/harika-ozellik`).
3. Değişikliklerinizi commit edin (`git commit -m "feat: harika özellik eklendi"`).
4. Branch'inizi push edin (`git push origin feature/harika-ozellik`).
5. **Pull Request** açın ve açıklamalı bir başlık ekleyin.

---

## ❓ Sık Sorulan Sorular (FAQ)

<details>
<summary><strong>Local GPU ve PyTorch gerekmiyor mu?</strong></summary>

**Hayır.** Ağır `sentence-transformers` ve yerel CrossEncoder reranker modellerini tamamen kaldırarak yerine OpenAI API (`text-embedding-3-small`) kullandık. Bu sayede uygulamanın bellek kullanımı dramatik olarak azaldı ve sunucu GPU'suz makinelerde dahi milisaniyeler içinde ayağa kalkıp anlık yanıtlar üretebilmektedir.

</details>

<details>
<summary><strong>Eski verilerim/indekslerim için ne yapmalıyım?</strong></summary>

Boyut değişimi (`1024/768` → `1536`) nedeniyle OpenSearch üzerindeki eski indeksi kaldırıp yenisini oluşturmanız gerekmektedir. Bunu yapmak için projenin ana dizininden şu scripti çalıştırmanız yeterlidir:
```bash
backend/venv/bin/python scripts/build_index.py
```
Bu script eski indeksi silecek, OpenAI small embedding şemasına (1536 boyut) uygun yeni indeksi açacak ve verilerinizi otomatik olarak yeniden embed edip indeksleyecektir.

</details>

<details>
<summary><strong>Hangi dosya formatları destekleniyor?</strong></summary>

Şu an **PDF**, **DOCX**, **HTML** ve **TXT** formatları desteklenmektedir. Diğer formatlar için `backend/app/services/document_service.py` dosyasını genişletebilirsiniz.

</details>

<details>
<summary><strong>OpenAI yerine yerel bir LLM kullanabilir miyim?</strong></summary>

Evet. [Ollama](https://ollama.com/) kurarak `.env` dosyasında `OLLAMA_BASE_URL` ve `OLLAMA_MODEL` değişkenlerini yapılandırın, ardından `LLM_PROVIDER=ollama` olarak ayarlayın.

</details>

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

---

<p align="center">
  Made with ❤️ by the Legal AI Developer Team.
</p>
