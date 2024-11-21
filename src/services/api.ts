import axios from 'axios';
import OpenAI from 'openai';
import type { Settings, NewsItem } from '../types';

export async function fetchRssFeed(url: string): Promise<string> {
  try {
    const response = await axios.get(`/api/feed?url=${encodeURIComponent(url)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw new Error('Failed to fetch RSS feed');
  }
}

export async function analyzeArticle(item: { title: string; content: string }, settings: Settings): Promise<string> {
  const openai = new OpenAI({
    apiKey: settings.apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    const response = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: 'user',
          content: `${settings.prompt}\n\nArticle Title: ${item.title}\nContent: ${item.content}`
        }
      ]
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error analyzing article:', error);
    throw new Error('Failed to analyze article');
  }
}