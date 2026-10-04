# FoodTruth

FoodTruth is an AI-powered application that analyzes food packaging images (front and back) to extract nutritional information and ingredients. It uses the Gemini API for precise data extraction and runs comprehensive audits against predefined rules to verify compliance and highlight potential health warnings.

## 🚀 Features

- **Automated Data Extraction**: Upload images of food labels, and the system automatically extracts nutrition facts and ingredient lists using Google's Gemini models.
- **Rule-Based Auditing**: Runs safety and compliance checks on the extracted data, identifying things like hidden sugars, allergens, or misleading claims.
- **Interactive UI**: A modern React frontend built with Vite and Tailwind CSS to easily review results.
- **Demo Mode**: Includes pre-configured demo samples for quick testing.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Python, FastAPI, Uvicorn
- **AI/ML**: Google GenAI (Gemini)

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

## ⚙️ Setup and Installation

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Open the `.env` file and add your `GEMINI_API_KEY`:
```env
GEMINI_API_KEY=your_actual_api_key_here
FOODTRUTH_MODEL=gemini-1.5-pro
```

Start the FastAPI server:
```bash
python main.py
```
*The backend API will be available at `http://localhost:8000`*

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
*The web app will be available at `http://localhost:5173`*

## 💡 Usage

1. Open your browser and navigate to `http://localhost:5173`.
2. **Upload Images**: Provide images of the front and back of a food package.
3. **API Key**: If you didn't set the API key in the backend `.env` file, you can provide it directly through the UI.
4. **Analyze**: Click submit to extract data and view the audit matrix!
