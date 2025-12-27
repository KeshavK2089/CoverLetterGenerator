/**
 * Web Scraper Module
 * Scrapes job postings and company websites for personalization data
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Clean text by removing extra whitespace and newlines
 */
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
}

/**
 * Scrape a job posting URL and extract the job description
 */
async function scrapeJobPosting(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);

        // Remove script and style elements
        $('script, style, nav, footer, header, aside').remove();

        // Common job description selectors
        const selectors = [
            '.job-description',
            '.description',
            '#job-description',
            '[data-automation="jobDescription"]',
            '.jobs-description',
            '.job-details',
            '.posting-requirements',
            'article',
            '.content',
            'main',
            'body'
        ];

        let jobText = '';

        for (const selector of selectors) {
            const element = $(selector);
            if (element.length > 0) {
                jobText = cleanText(element.text());
                if (jobText.length > 200) {
                    break;
                }
            }
        }

        // Extract title if possible
        let title = '';
        const titleSelectors = [
            'h1',
            '.job-title',
            '.posting-title',
            '[data-automation="job-title"]'
        ];

        for (const selector of titleSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                title = cleanText(element.text());
                if (title.length > 5 && title.length < 200) {
                    break;
                }
            }
        }

        return {
            success: true,
            title: title,
            content: jobText,
            url: url
        };
    } catch (error) {
        console.error('Error scraping job posting:', error.message);
        return {
            success: false,
            error: error.message,
            url: url
        };
    }
}

/**
 * Scrape a company website for personalization data
 */
async function scrapeCompanyWebsite(url) {
    try {
        // Normalize URL
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const baseUrl = new URL(url).origin;

        // Pages to scrape for company info
        const pagesToScrape = [
            baseUrl,
            baseUrl + '/about',
            baseUrl + '/about-us',
            baseUrl + '/company',
            baseUrl + '/mission',
            baseUrl + '/our-science',
            baseUrl + '/pipeline',
            baseUrl + '/products',
            baseUrl + '/careers'
        ];

        let companyData = {
            name: '',
            mission: '',
            values: '',
            products: '',
            science: '',
            culture: '',
            recentNews: '',
            rawContent: ''
        };

        // Scrape main page first
        const mainResponse = await axios.get(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        });

        const $main = cheerio.load(mainResponse.data);

        // Extract company name from title or h1
        companyData.name = cleanText($main('title').text().split('|')[0].split('-')[0]) ||
            cleanText($main('h1').first().text());

        // Remove non-content elements
        $main('script, style, nav, footer, iframe, noscript').remove();
        companyData.rawContent = cleanText($main('body').text()).substring(0, 5000);

        // Try to scrape additional pages
        const additionalPages = ['/about', '/about-us', '/our-science', '/pipeline'];

        for (const page of additionalPages) {
            try {
                const pageUrl = baseUrl + page;
                const response = await axios.get(pageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    },
                    timeout: 5000
                });

                const $ = cheerio.load(response.data);
                $('script, style, nav, footer, iframe, noscript').remove();

                const pageContent = cleanText($('main, article, .content, body').text()).substring(0, 3000);

                if (page.includes('about') || page.includes('mission')) {
                    companyData.mission += ' ' + pageContent;
                } else if (page.includes('science') || page.includes('pipeline')) {
                    companyData.science += ' ' + pageContent;
                }
            } catch (e) {
                // Page doesn't exist, continue
            }
        }

        return {
            success: true,
            data: companyData,
            url: baseUrl
        };
    } catch (error) {
        console.error('Error scraping company website:', error.message);
        return {
            success: false,
            error: error.message,
            url: url
        };
    }
}

/**
 * Extract key information from scraped company data
 */
function summarizeCompanyData(companyData) {
    let summary = '';

    if (companyData.name) {
        summary += `Company: ${companyData.name}\n\n`;
    }

    if (companyData.mission) {
        summary += `About/Mission:\n${companyData.mission.substring(0, 2000)}\n\n`;
    }

    if (companyData.science) {
        summary += `Science/Pipeline:\n${companyData.science.substring(0, 2000)}\n\n`;
    }

    if (companyData.rawContent && !companyData.mission) {
        summary += `Website Content:\n${companyData.rawContent.substring(0, 3000)}\n`;
    }

    return summary || 'No detailed company information could be extracted.';
}

module.exports = {
    scrapeJobPosting,
    scrapeCompanyWebsite,
    summarizeCompanyData,
    cleanText
};
