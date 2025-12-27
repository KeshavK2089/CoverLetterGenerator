/**
 * Cover Letter Generator - Express Server
 * Main server file handling API routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { getResumeText, RESUME_CONTENT } = require('./src/resumeParser');
const { scrapeJobPosting, scrapeCompanyWebsite, summarizeCompanyData } = require('./src/webScraper');
const { generateCoverLetter, generateResumeBullets, analyzeCompanyData } = require('./src/claudeService');
const { generateCoverLetterDocx, generateBulletsDocx } = require('./src/documentGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Store generated content in memory for download
const generatedContent = new Map();

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cover Letter Generator is running' });
});

/**
 * API status endpoint - tells frontend if server has API key
 */
app.get('/api/status', (req, res) => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    res.json({
        success: true,
        apiConfigured: hasApiKey,
        message: hasApiKey ? 'Ready to generate' : 'API key not configured on server'
    });
});

/**
 * Get resume data endpoint
 */
app.get('/api/resume', (req, res) => {
    res.json({
        success: true,
        data: RESUME_CONTENT,
        text: getResumeText()
    });
});

/**
 * Scrape job posting from URL
 */
app.post('/api/scrape-job', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const result = await scrapeJobPosting(url);
    res.json(result);
});

/**
 * Scrape company website
 */
app.post('/api/scrape-company', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const result = await scrapeCompanyWebsite(url);

    if (result.success) {
        result.summary = summarizeCompanyData(result.data);
    }

    res.json(result);
});

/**
 * Generate cover letter and resume bullets
 */
app.post('/api/generate', async (req, res) => {
    const {
        jobDescription,
        companyInfo,
        roleTitle,
        companyName
    } = req.body;

    // Use server-side API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Server API key not configured. Please set GEMINI_API_KEY environment variable.' });
    }

    if (!jobDescription) {
        return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    const resumeText = getResumeText();

    try {
        // Generate cover letter and bullets in parallel
        const [coverLetterResult, bulletsResult] = await Promise.all([
            generateCoverLetter(apiKey, resumeText, jobDescription, companyInfo, roleTitle, companyName),
            generateResumeBullets(apiKey, resumeText, jobDescription, roleTitle, companyName)
        ]);

        if (!coverLetterResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Cover letter generation failed: ' + coverLetterResult.error
            });
        }

        if (!bulletsResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Resume bullets generation failed: ' + bulletsResult.error
            });
        }

        // Store for download
        const sessionId = Date.now().toString();
        generatedContent.set(sessionId, {
            coverLetter: coverLetterResult.content,
            bullets: bulletsResult.content,
            roleTitle,
            companyName,
            timestamp: new Date()
        });

        // Clean up old sessions (keep last 10)
        if (generatedContent.size > 10) {
            const oldestKey = generatedContent.keys().next().value;
            generatedContent.delete(oldestKey);
        }

        res.json({
            success: true,
            sessionId,
            coverLetter: coverLetterResult.content,
            bullets: bulletsResult.content
        });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Generation failed: ' + error.message
        });
    }
});

/**
 * Download cover letter as DOCX
 */
app.get('/api/download/cover-letter/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const content = generatedContent.get(sessionId);

    if (!content) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }

    try {
        const docxBuffer = await generateCoverLetterDocx(
            content.coverLetter,
            RESUME_CONTENT.name,
            content.roleTitle,
            content.companyName
        );

        const filename = `Cover_Letter_${content.companyName || 'Application'}_${RESUME_CONTENT.name.replace(/\s/g, '_')}.docx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(docxBuffer);
    } catch (error) {
        console.error('DOCX generation error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate document' });
    }
});

/**
 * Download resume bullets as DOCX
 */
app.get('/api/download/bullets/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const content = generatedContent.get(sessionId);

    if (!content) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }

    try {
        const docxBuffer = await generateBulletsDocx(
            content.bullets,
            content.roleTitle,
            content.companyName
        );

        const filename = `Resume_Bullets_${content.companyName || 'Optimized'}_${RESUME_CONTENT.name.replace(/\s/g, '_')}.docx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(docxBuffer);
    } catch (error) {
        console.error('DOCX generation error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate document' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🧬 Cover Letter Generator running at http://localhost:${PORT}`);
    console.log(`\nReady to generate personalized cover letters for biotech/pharma roles.\n`);
});
