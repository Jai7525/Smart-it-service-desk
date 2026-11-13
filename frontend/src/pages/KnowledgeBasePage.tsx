import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight, Tag, ThumbsUp, ArrowLeft } from 'lucide-react';
import { IncidentCategory } from '../types';

interface Article {
  id: string;
  title: string;
  category: IncidentCategory;
  summary: string;
  content: string;
  readTime: string;
}

export const KnowledgeBasePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      id: 'kb-1',
      title: 'How to Connect to Corporate GlobalProtect VPN',
      category: 'Network',
      readTime: '3 min read',
      summary: 'Step-by-step instructions for establishing a secure remote session using MFA tokens.',
      content: `1. Ensure your Wi-Fi or LAN connection is active.
2. Launch GlobalProtect from your system tray.
3. In the portal field, type: vpn.company.com
4. Enter your standard corporate username and password.
5. Approve the push notification sent to your registered authenticator app.
6. Once connected, your status icon will display a blue shield.`,
    },
    {
      id: 'kb-2',
      title: 'Self-Service Active Directory Password Reset Guide',
      category: 'Access',
      readTime: '2 min read',
      summary: 'Recover locked accounts or update expiring credentials without contacting IT support.',
      content: `1. Navigate to the identity portal: https://identity.company.local
2. Select "Can't access your account?".
3. Enter your work email and complete the CAPTCHA.
4. Choose verification via SMS or Authenticator verification code.
5. Create a new compliant password (minimum 12 characters, uppercase, lowercase, numbers, and symbols).`,
    },
    {
      id: 'kb-3',
      title: 'Troubleshooting Wi-Fi Dropouts on Floor 2',
      category: 'Network',
      readTime: '4 min read',
      summary: 'Workaround and channel reconfiguration steps while edge switch upgrades are in progress.',
      content: `If experiencing drops on Floor 2:
1. Turn Wi-Fi Off and On from your OS menu bar.
2. Connect to the secondary 5GHz SSID: Corp-5G-Reserve.
3. If drops persist, disconnect from Wi-Fi and plug into the wired ethernet port at desk docks.`,
    },
    {
      id: 'kb-4',
      title: 'Fixing Outlook / Teams Audio Peripheral Detection',
      category: 'Hardware',
      readTime: '3 min read',
      summary: 'Resolve headsets, microphones, and webcam connectivity glitches in communication apps.',
      content: `1. In Teams, go to Settings -> Devices.
2. Under Audio devices, ensure "Custom Setup" is not selected.
3. Select your designated headset from the Speaker and Microphone dropdowns.
4. Click "Make a test call" to verify input levels.`,
    },
  ];

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          IT Knowledge Base & Troubleshooting
        </h1>
        <p className="text-xs text-slate-500">
          Find instant self-service solutions, system setup guides, and standard IT policies.
        </p>
      </div>

      {activeArticle ? (
        /* Full Article View */
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs max-w-3xl">
          <button
            onClick={() => setActiveArticle(null)}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Articles
          </button>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                {activeArticle.category}
              </span>
              <span className="text-[11px] text-slate-400">{activeArticle.readTime}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{activeArticle.title}</h2>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded p-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
            {activeArticle.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Was this article helpful?</span>
            <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
              Yes, solved my issue
            </button>
          </div>
        </div>
      ) : (
        /* Article Listing & Search */
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search troubleshooting articles (VPN, password, wifi...)"
                className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['all', 'Network', 'Hardware', 'Access', 'Software'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'all' ? 'All Guides' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => setActiveArticle(art)}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{art.readTime}</span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-900 mb-1 line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 pt-3 mt-3 border-t border-slate-100">
                  <span>Read Troubleshooting Steps</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

