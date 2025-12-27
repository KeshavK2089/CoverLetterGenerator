# Cover Letter Generator

Generate personalized, ATS-optimized cover letters and resume bullet points for biotech/pharma roles.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Claude API key:
   ```bash
   export CLAUDE_API_KEY="sk-ant-api03-your-key-here"
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable `CLAUDE_API_KEY` in Vercel dashboard
4. Deploy

Your API key is stored securely as a server-side environment variable and never exposed to users.
