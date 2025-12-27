/**
 * Cover Letter Generator - Frontend Application
 * Handles UI interactions and API communication
 * Server-side API key version (no client-side key needed)
 */

// API Base URL
const API_BASE = '';

// State
let currentSessionId = null;
let serverApiConfigured = false;

// DOM Elements
const apiStatus = document.getElementById('apiStatus');
const jobDescriptionInput = document.getElementById('jobDescription');
const jobUrlInput = document.getElementById('jobUrl');
const scrapeJobBtn = document.getElementById('scrapeJob');
const scrapedJobPreview = document.getElementById('scrapedJobPreview');

const companyNameInput = document.getElementById('companyName');
const roleTitleInput = document.getElementById('roleTitle');
const companyUrlInput = document.getElementById('companyUrl');
const scrapeCompanyBtn = document.getElementById('scrapeCompany');
const companyResearchPreview = document.getElementById('companyResearchPreview');

const generateBtn = document.getElementById('generateBtn');
const resultsSection = document.getElementById('resultsSection');
const coverLetterContent = document.getElementById('coverLetterContent');
const bulletsContent = document.getElementById('bulletsContent');
const downloadCoverLetterBtn = document.getElementById('downloadCoverLetter');
const downloadBulletsBtn = document.getElementById('downloadBullets');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toastContainer = document.getElementById('toastContainer');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const pasteTab = document.getElementById('pasteTab');
const urlTab = document.getElementById('urlTab');

// Scraped data storage
let scrapedCompanyInfo = '';

// ==========================================
// Initialization
// ==========================================

async function init() {
    // Check server API status
    await checkServerStatus();

    // Set up event listeners
    setupEventListeners();

    // Check generate button state
    updateGenerateButton();
}

async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const result = await response.json();

        serverApiConfigured = result.apiConfigured;
        updateApiStatusDisplay(result.apiConfigured);

        if (!result.apiConfigured) {
            showToast('Server API key not configured. Contact administrator.', 'warning');
        }
    } catch (error) {
        updateApiStatusDisplay(false);
        showToast('Could not connect to server', 'error');
    }
}

function updateApiStatusDisplay(isConfigured) {
    const statusDot = apiStatus.querySelector('.status-dot');
    const statusText = apiStatus.querySelector('.status-text');

    if (isConfigured) {
        statusDot.classList.add('active');
        statusText.textContent = 'Ready';
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = 'Not Configured';
    }
}

function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Scraping
    scrapeJobBtn.addEventListener('click', scrapeJobPosting);
    scrapeCompanyBtn.addEventListener('click', scrapeCompanyWebsite);

    // Input change handlers
    jobDescriptionInput.addEventListener('input', updateGenerateButton);

    // Generate
    generateBtn.addEventListener('click', generateContent);

    // Downloads
    downloadCoverLetterBtn.addEventListener('click', () => downloadDocument('cover-letter'));
    downloadBulletsBtn.addEventListener('click', () => downloadDocument('bullets'));
}

// ==========================================
// Tab Switching
// ==========================================

function switchTab(tab) {
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    pasteTab.classList.toggle('active', tab === 'paste');
    urlTab.classList.toggle('active', tab === 'url');
}

// ==========================================
// Web Scraping
// ==========================================

async function scrapeJobPosting() {
    const url = jobUrlInput.value.trim();

    if (!url) {
        showToast('Please enter a job posting URL', 'error');
        return;
    }

    scrapeJobBtn.disabled = true;
    scrapeJobBtn.innerHTML = '<span class="loading-spinner"></span> Fetching...';

    try {
        const response = await fetch(`${API_BASE}/api/scrape-job`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const result = await response.json();

        if (result.success) {
            // Update the job description textarea
            jobDescriptionInput.value = result.content;

            // Show preview
            scrapedJobPreview.classList.remove('hidden');
            scrapedJobPreview.innerHTML = `
                <strong>${result.title || 'Job Posting'}</strong><br>
                <em>Extracted ${result.content.length} characters from job posting.</em>
            `;

            // Switch to paste tab to show the content
            switchTab('paste');

            updateGenerateButton();
            showToast('Job description extracted successfully', 'success');
        } else {
            showToast('Failed to extract job posting: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        scrapeJobBtn.disabled = false;
        scrapeJobBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M9 12l2 2 4-4"/>
            </svg>
            Fetch
        `;
    }
}

async function scrapeCompanyWebsite() {
    const url = companyUrlInput.value.trim();

    if (!url) {
        showToast('Please enter a company website URL', 'error');
        return;
    }

    scrapeCompanyBtn.disabled = true;
    scrapeCompanyBtn.innerHTML = '<span class="loading-spinner"></span> Researching...';

    try {
        const response = await fetch(`${API_BASE}/api/scrape-company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const result = await response.json();

        if (result.success) {
            scrapedCompanyInfo = result.summary;

            // Update company name if we found it
            if (result.data.name && !companyNameInput.value) {
                companyNameInput.value = result.data.name.substring(0, 50);
            }

            // Show preview
            companyResearchPreview.classList.remove('hidden');
            companyResearchPreview.textContent = result.summary.substring(0, 500) +
                (result.summary.length > 500 ? '...' : '');

            showToast('Company research complete', 'success');
        } else {
            showToast('Failed to research company: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        scrapeCompanyBtn.disabled = false;
        scrapeCompanyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
            </svg>
            Research
        `;
    }
}

// ==========================================
// Content Generation
// ==========================================

function updateGenerateButton() {
    const hasJobDescription = jobDescriptionInput.value.trim().length > 50;
    generateBtn.disabled = !(serverApiConfigured && hasJobDescription);
}

async function generateContent() {
    const jobDescription = jobDescriptionInput.value.trim();
    const companyName = companyNameInput.value.trim();
    const roleTitle = roleTitleInput.value.trim();

    if (!serverApiConfigured) {
        showToast('Server API key not configured', 'error');
        return;
    }

    if (!jobDescription || jobDescription.length < 50) {
        showToast('Please provide a complete job description', 'error');
        return;
    }

    // Show loading
    showLoading('Analyzing job requirements...');

    try {
        // Update loading messages
        setTimeout(() => updateLoadingText('Researching company and position...'), 2000);
        setTimeout(() => updateLoadingText('Crafting personalized cover letter...'), 5000);
        setTimeout(() => updateLoadingText('Optimizing resume bullet points...'), 8000);
        setTimeout(() => updateLoadingText('Applying professional writing standards...'), 11000);

        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobDescription,
                companyInfo: scrapedCompanyInfo,
                companyName,
                roleTitle
            })
        });

        const result = await response.json();

        if (result.success) {
            currentSessionId = result.sessionId;

            // Display results
            coverLetterContent.textContent = result.coverLetter;
            bulletsContent.textContent = result.bullets;

            // Show results section
            resultsSection.classList.remove('hidden');

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            showToast('Content generated successfully', 'success');
        } else {
            showToast('Generation failed: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Network error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ==========================================
// Document Download
// ==========================================

async function downloadDocument(type) {
    if (!currentSessionId) {
        showToast('No content to download. Generate content first.', 'error');
        return;
    }

    const endpoint = type === 'cover-letter'
        ? `/api/download/cover-letter/${currentSessionId}`
        : `/api/download/bullets/${currentSessionId}`;

    try {
        const response = await fetch(`${API_BASE}${endpoint}`);

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = type === 'cover-letter' ? 'Cover_Letter.docx' : 'Resume_Bullets.docx';

        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) {
                filename = match[1];
            }
        }

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('Document downloaded successfully', 'success');
    } catch (error) {
        showToast('Download failed: ' + error.message, 'error');
    }
}

// ==========================================
// Loading & Toast Utilities
// ==========================================

function showLoading(message) {
    loadingText.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

function updateLoadingText(message) {
    if (!loadingOverlay.classList.contains('hidden')) {
        loadingText.textContent = message;
    }
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;

    toastContainer.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// Initialize App
// ==========================================

document.addEventListener('DOMContentLoaded', init);
