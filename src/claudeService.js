/**
 * Gemini API Service Module
 * Handles communication with Google Gemini for content generation
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCoverLetterPrompt, getResumeBulletsPrompt } = require('./prompts');

/**
 * Generate a cover letter using Gemini
 */
async function generateCoverLetter(apiKey, resumeText, jobDescription, companyInfo, roleTitle, companyName) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = getCoverLetterPrompt(resumeText, jobDescription, companyInfo, roleTitle, companyName);

    try {
        const result = await model.generateContent(prompt);
        let coverLetter = result.response.text();

        // Post-process to remove any em dashes that might slip through
        coverLetter = coverLetter.replace(/—/g, ',');
        coverLetter = coverLetter.replace(/–/g, '-');

        return {
            success: true,
            content: coverLetter
        };
    } catch (error) {
        console.error('Gemini API error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate optimized resume bullet points using Gemini
 */
async function generateResumeBullets(apiKey, resumeText, jobDescription, roleTitle, companyName) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = getResumeBulletsPrompt(resumeText, jobDescription, roleTitle, companyName);

    try {
        const result = await model.generateContent(prompt);
        let bullets = result.response.text();

        // Post-process to remove any em dashes
        bullets = bullets.replace(/—/g, ',');
        bullets = bullets.replace(/–/g, '-');

        return {
            success: true,
            content: bullets
        };
    } catch (error) {
        console.error('Gemini API error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Research a company using Gemini with web context
 */
async function analyzeCompanyData(apiKey, companyInfo, companyName) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
        const result = await model.generateContent(prompt);

        return {
            success: true,
            content: result.response.text()
        };
    } catch (error) {
        console.error('Gemini API error:', error.message);
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
