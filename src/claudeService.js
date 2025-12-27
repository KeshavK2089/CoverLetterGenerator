/**
 * Claude API Service Module
 * Handles communication with Claude for content generation
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getCoverLetterPrompt, getResumeBulletsPrompt } = require('./prompts');

/**
 * Generate a cover letter using Claude
 */
async function generateCoverLetter(apiKey, resumeText, jobDescription, companyInfo, roleTitle, companyName) {
    const client = new Anthropic({ apiKey });

    const prompt = getCoverLetterPrompt(resumeText, jobDescription, companyInfo, roleTitle, companyName);

    try {
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        let coverLetter = response.content[0].text;

        // Post-process to remove any em dashes that might slip through
        coverLetter = coverLetter.replace(/—/g, ',');
        coverLetter = coverLetter.replace(/–/g, '-');

        return {
            success: true,
            content: coverLetter
        };
    } catch (error) {
        console.error('Claude API error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate optimized resume bullet points using Claude
 */
async function generateResumeBullets(apiKey, resumeText, jobDescription, roleTitle, companyName) {
    const client = new Anthropic({ apiKey });

    const prompt = getResumeBulletsPrompt(resumeText, jobDescription, roleTitle, companyName);

    try {
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        let bullets = response.content[0].text;

        // Post-process to remove any em dashes
        bullets = bullets.replace(/—/g, ',');
        bullets = bullets.replace(/–/g, '-');

        return {
            success: true,
            content: bullets
        };
    } catch (error) {
        console.error('Claude API error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Research a company using Claude with web context
 */
async function analyzeCompanyData(apiKey, companyInfo, companyName) {
    const client = new Anthropic({ apiKey });

    const prompt = `Analyze this company information and extract key points useful for a job application cover letter.

Company: ${companyName || 'Unknown'}

Scraped Website Content:
${companyInfo}

---

Provide a brief summary (5-7 sentences) covering:
1. What the company does (therapeutic area, technology platform)
2. Their mission or values
3. Key products or pipeline
4. Recent developments or focus areas
5. Company culture indicators

Be specific. Use information from the scraped content only. Do not make up facts.`;

    try {
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        return {
            success: true,
            content: response.content[0].text
        };
    } catch (error) {
        console.error('Claude API error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    generateCoverLetter,
    generateResumeBullets,
    analyzeCompanyData
};
