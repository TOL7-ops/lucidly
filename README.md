# Lucidly - Dream Journal & Analysis Platform

A beautiful, AI-powered dream journaling application built with Next.js, React, TypeScript, Tailwind CSS, and shadcn-ui components.

## ✨ Features

- 🎙️ **Voice Recording** - Record your dreams with audio transcription
- 🤖 **AI Analysis** - Get AI-powered dream summaries, sentiment analysis, and interpretations
- 📱 **Modern UI** - Beautiful, responsive design with cosmic themes
- 🔐 **Authentication** - Secure user authentication with Supabase
- 📊 **Dashboard** - Track your dream patterns and statistics
- 🌙 **Dream Types** - Categorize dreams by mood (lucid, peaceful, vivid, nightmare)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Hugging Face account (for AI features)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd lucidly-dreamscape-design
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Hugging Face API Key
   HF_API_KEY=your_hugging_face_api_token
   ```

### How to Get Your API Keys

#### Supabase Setup
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your Project URL and anon/public key

#### Hugging Face Setup
1. Go to [huggingface.co](https://huggingface.co)
2. Create an account and sign in
3. Go to Settings > Access Tokens
4. Create a new token with "Read" permission
5. Copy the token

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## 🔧 API Endpoints

The application includes the following API endpoints:

- `POST /api/dreams` - Create a new dream entry
- `GET /api/dreams` - Get all dreams for authenticated user
- `GET /api/dreams/[id]` - Get a specific dream
- `PATCH /api/dreams/[id]` - Update dream with AI analysis
- `DELETE /api/dreams/[id]` - Delete a dream
- `POST /api/transcribe` - Transcribe audio to text
- `GET /api/health` - Health check endpoint

## 🤖 AI Features

The app uses Hugging Face models for:

- **Speech-to-Text**: Audio transcription using Whisper models
- **Summarization**: Dream content summarization
- **Sentiment Analysis**: Emotional analysis of dreams
- **Dream Interpretation**: AI-powered dream meanings

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn-ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Services**: Hugging Face APIs
- **Audio Processing**: Web Audio API, FormData

## 📁 Project Structure

```
├── pages/
│   ├── api/           # API routes
│   ├── _app.tsx       # App wrapper
│   └── index.tsx      # Home page
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   └── pages/         # Page components
├── public/            # Static assets
└── styles/            # Global styles
```

## 🔒 Authentication

The app now includes **full Supabase authentication**:

### Features
- ✅ **Real Login/Signup** - Complete authentication flow with email/password
- ✅ **Session Persistence** - Users stay logged in across browser refreshes
- ✅ **Protected Routes** - API routes require valid JWT tokens
- ✅ **Auto-redirect** - Unauthenticated users are redirected to login
- ✅ **Logout Functionality** - Clean session termination

### How to Use
1. Click **"Start Your Journey"** or **"Begin Your Dream Journey"** → redirects to `/login`
2. Create account or sign in with existing credentials
3. Access dashboard and record dreams (requires authentication)
4. Click **Logout** in navigation to sign out

### Setup Requirements
- Set up Supabase project with authentication enabled
- Configure your `.env.local` with Supabase credentials
- Database `dreams` table with RLS policies (users can only access their own dreams)

## 🐛 Troubleshooting

### Transcription Not Working
- Ensure your `HF_API_KEY` is set correctly in `.env.local`
- Check the browser console for API errors
- Verify your Hugging Face token has the correct permissions

### Database Errors
- Verify your Supabase credentials
- Check that your database schema is set up correctly
- Ensure Row Level Security (RLS) policies are configured

### Environment Variables Not Loading
- Make sure your file is named exactly `.env.local`
- Restart the development server after adding environment variables
- Check that there are no syntax errors in your `.env.local` file

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Happy dreaming! 🌙✨**
