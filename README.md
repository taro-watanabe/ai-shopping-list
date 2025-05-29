# AI-Powered Shopping List

A modern, intelligent shopping list application built with Next.js that uses AI to analyze receipts, generate item descriptions, and provide smart shopping recommendations.

## 🚀 Features

### Core Functionality
- **Smart Shopping Lists**: Create and manage shopping items with tags, categories, and pricing
- **Receipt Analysis**: Upload receipt images for automatic item extraction using AI vision models
- **Semantic Search**: Find similar items using AI embeddings and vector search
- **Smart Descriptions**: AI-generated contextual keywords and descriptions for items
- **Multi-language Support**: Configurable language and currency settings

### Organization & Tracking
- **Tags & Categories**: Organize items by store, category, or custom tags with color coding
- **People Management**: Track who bought what items and assign costs
- **Price Tracking**: Monitor spending and item costs over time
- **Archived Items**: View purchase history and previously bought items

### AI-Powered Features
- **Receipt OCR**: Extract items, prices, and details from receipt photos
- **Item Matching**: Automatically match receipt items to existing shopping list items
- **Smart Suggestions**: Get AI-generated keywords and descriptions for better organization
- **Vector Similarity**: Find related items using semantic similarity

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Turso (cloud SQLite)
- **ORM**: Drizzle ORM
- **AI Services**: 
  - OpenAI (embeddings)
  - OpenRouter (multimodal analysis)
- **State Management**: TanStack Query (React Query)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Turso account (for database) or local SQLite
- OpenAI API key (for embeddings)
- OpenRouter API key (for receipt analysis)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url> ai-shopping-list
   cd ai-shopping-list
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the sample environment file:
   ```bash
   cp SAMPLE_ENV_FILE.txt .env.local
   ```

   Configure the following variables:

   **Database (Turso - Recommended)**
   ```env
   # Option 1: Direct values (not recommended for production)
   TURSO_DATABASE_URL=libsql://your-database-url.turso.io
   TURSO_AUTH_TOKEN=your-auth-token

   # Option 2: File paths (recommended for production)
   TURSO_DATABASE_URL_PATH=/absolute/path/to/turso_url_file
   TURSO_AUTH_TOKEN_PATH=/absolute/path/to/turso_token_file
   ```

   **AI API Keys**
   ```env
   # Option 1: Direct values
   OPENROUTER_API_KEY=sk-or-xxxxxx
   OPENAI_API_KEY=sk-xxxxxx

   # Option 2: File paths (recommended)
   OPENROUTER_API_KEY_PATH=/absolute/path/to/openrouter_key_file
   OPENAI_API_KEY_PATH=/absolute/path/to/openai_key_file
   ```

   **Localization (Optional)**
   ```env
   DOMICILE_COUNTRY=Italy
   DOMICILE_LANGUAGE=Italian
   CURRENCY=€
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🎯 Usage

### Basic Shopping List Management

1. **Add Items**: Type item names and optionally assign tags/categories
2. **Check Off Items**: Mark items as purchased and assign to people with prices
3. **Filter & Search**: Use tag and people filters to organize your view
4. **View History**: Check archived items to see purchase patterns

### Receipt Analysis Workflow

1. **Upload Receipt**: Click "Upload Receipt" and select a photo
2. **AI Analysis**: The system extracts items, prices, and descriptions
3. **Match Items**: Review and match extracted items to your shopping list
4. **Bulk Operations**: Create new items or update existing ones in bulk

### Smart Features

- **Item Descriptions**: When adding items, get AI-generated keywords and context
- **Similar Items**: The system suggests similar items based on semantic matching
- **Multi-language**: Supports bilingual descriptions and localized currency

## 📂 Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── components/        # Shared components
│   └── [pages]/          # Page components
├── components/            # React components
│   ├── receipt-*.tsx     # Receipt-related modals
│   ├── item-*.tsx        # Item management components
│   └── ui/               # Reusable UI components
├── db/                   # Database configuration
│   ├── schema.ts         # Drizzle schema definitions
│   └── index.ts          # Database client
├── lib/                  # Utility libraries
│   ├── openai.ts         # OpenAI integration
│   └── openrouter.ts     # OpenRouter integration
└── drizzle/              # Database migrations
```

## 🔐 Security Notes

- **Production Deployment**: Use file-based API key storage rather than environment variables
- **File Permissions**: Set API key files to `chmod 400` for security
- **Database**: Turso provides secure, serverless SQLite with built-in encryption

## 📱 API Endpoints

- `GET/POST /api/items` - Manage shopping list items
- `GET/POST /api/tags` - Manage categories/tags
- `GET/POST /api/people` - Manage people
- `POST /api/receipts` - Upload and analyze receipts
- `POST /api/openrouter` - Receipt analysis via AI
- `POST /api/openai` - Generate embeddings
- `POST /api/itemdescription` - Generate item descriptions

---

**Note**: This application uses AI services that may incur costs. Monitor your API usage and set appropriate limits.