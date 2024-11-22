import React, { useState, useEffect } from 'react';
import Parser from 'rss-parser';
import { useSettings } from '../contexts/SettingsContext';
import { NewsItem } from '../types';
import { RefreshCw, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { fetchRssFeed, analyzeArticle } from '../services/api';

export function NewsList() {
  const { settings } = useSettings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshingItems, setRefreshingItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const refreshSingleAnalysis = async (index: number, item: NewsItem) => {
    if (!settings.apiKey) {
      setError('Please set your OpenAI API key in the settings');
      return;
    }
    
    setRefreshingItems(prev => new Set(prev).add(index));
    
    try {
      const newAnalysis = await analyzeArticle({
        title: item.title,
        content: item.content,
      }, settings);

      setNews(prev => prev.map((newsItem, i) => 
        i === index ? { ...newsItem, analysis: newAnalysis } : newsItem
      ));
    } catch (error) {
      setError('Failed to refresh analysis');
    } finally {
      setRefreshingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const fetchAndAnalyzeNews = async () => {
    if (!settings.apiKey) {
      setError('Please set your OpenAI API key in the settings');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const feedData = await fetchRssFeed(settings.feedUrl);
      
      const parser = new Parser({
        customFields: {
          item: [
            ['dc:creator', 'creator'],
            ['content:encoded', 'contentEncoded'],
          ],
        },
      });
      
      const feed = await parser.parseString(feedData);
      
      const newsItems: NewsItem[] = await Promise.all(
        feed.items.slice(0, 5).map(async (item) => {
          try {
            const analysis = await analyzeArticle({
              title: item.title || '',
              content: item.contentSnippet || '',
            }, settings);

            return {
              title: item.title || '',
              link: item.link || '',
              content: item.contentSnippet || '',
              pubDate: item.pubDate || '',
              creator: (item as any).creator || '',
              analysis
            };
          } catch (error) {
            console.error('Error analyzing article:', error);
            return {
              title: item.title || '',
              link: item.link || '',
              content: item.contentSnippet || '',
              pubDate: item.pubDate || '',
              creator: (item as any).creator || '',
              analysis: 'Failed to analyze this article'
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
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex-grow">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      {item.title}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </h2>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(item.pubDate).toLocaleString()}
                  </div>
                  {item.creator && (
                    <div className="flex items-center gap-1">
                      By {item.creator}
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  <div className="mb-4 text-gray-700 leading-relaxed">
                    {item.content}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-900">AI Analysis:</h3>
                      <button
                        onClick={() => refreshSingleAnalysis(index, item)}
                        disabled={refreshingItems.has(index)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingItems.has(index) ? 'animate-spin' : ''}`} />
                        Refresh Analysis
                      </button>
                    </div>
                    <p className="text-blue-800 leading-relaxed">{item.analysis}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}