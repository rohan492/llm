import axios from 'axios';
import cheerio from 'cheerio';
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const BASE_URL = 'https://www.lycamobile.us/en/';

async function scrapeWebsite(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    let texts = [];

    // Extract main content
    $('main p, main li, main h1, main h2, main h3').each((_, element) => {
      const text = $(element).text().trim();
      if (text) texts.push(text);
    });

    // Extract navigation items for additional context
    $('nav a').each((_, element) => {
      const text = $(element).text().trim();
      if (text) texts.push(text);
    });

    return texts;
  } catch (error) {
    console.error('Error scraping website:', error);
    return [];
  }
}

async function scrapeLycaMobile() {
  const mainPageTexts = await scrapeWebsite(BASE_URL);

  // Add more pages to scrape
  const additionalPages = [
    'plans/prepaid-phone-plans/#best-value',
    'plans/prepaid-phone-plans/#long-term-plans',
    'plans/prepaid-phone-plans/#family-plans',
    'plans/prepaid-phone-plans/refill-plans',
    'help-support/'
  ];

  for (const page of additionalPages) {
    const pageTexts = await scrapeWebsite(BASE_URL + page);
    mainPageTexts.push(...pageTexts);
  }

  return mainPageTexts;
}

export async function populateVectorStore() {
  const texts = await scrapeLycaMobile();

  if (texts.length === 0) {
    console.error('No texts scraped from Lyca Mobile website');
    return null;
  }

  const vectorStore = await HNSWLib.fromTexts(
    texts,
    texts.map((_, i) => ({ source: i })),
    new OpenAIEmbeddings()
  );

  return vectorStore;
}