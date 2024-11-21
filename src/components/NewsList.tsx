import React, { useState, useEffect } from 'react';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { useSettings } from '../contexts/SettingsContext';
import { NewsItem } from '../types';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function NewsList() {
  const { settings } = useSettings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndAnalyzeNews = async () => {
    if (!settings.apiKey) {
      setError('Please set your OpenAI API key in the settings');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parser = new Parser();
      const feed = await parser.parseURL(settings.feedUrl);
      
      const openai = new OpenAI({
        apiKey: settings.apiKey,
        dangerouslyAllowBrowser: true
      });

      const newsItems: NewsItem[] = await Promise.all(
        feed.items.slice(0, 5).map(async (item) => {
          try {
            const response = await openai.chat.completions.create({
              model: settings.model,
              messages: [
                {
                  role: 'user',
                  content: `${settings.prompt}\n\nArticle: ${item.title}\n${item.contentSnippet}`
                }
              ]
            });

            return {
              title: item.title || '',
              link: item.link || '',
              content: item.contentSnippet || '',
              pubDate: item.pubDate || '',
              analysis: response.choices[0]?.message?.content || ''
            };
          } catch (error) {
            console.error('Error analyzing article:', error);
            return {
              title: item.title || '',
              link: item.link || '',
              content: item.contentSnippet || '',
              pubDate: item.pubDate || '',
              analysis: 'Error analyzing this article'
            };
          }
        })
      );

      setNews(newsItems);
    } catch (error) {
      setError('Error fetching or analyzing news');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyzeNews();
  }, [settings.apiKey, settings.model, settings.feedUrl, settings.prompt]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Forex News Analysis</h1>
        <button
          onClick={fetchAndAnalyzeNews}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {item.title}
                </a>
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(item.pubDate).toLocaleString()}
              </p>
              <div className="prose max-w-none">
                <div className="mb-4 text-gray-700">{item.content}</div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">AI Analysis:</h3>
                  <p className="text-blue-800">{item.analysis}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}