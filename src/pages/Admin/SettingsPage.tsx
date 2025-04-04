import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { callNetlifyFunction } from '../../lib/supabase';

interface BlogSettings {
  posts_per_page: number;
  enable_comments: boolean;
  default_meta_title: string;
  default_meta_description: string;
  default_meta_keywords: string;
  show_author: boolean;
  show_date: boolean;
  show_reading_time: boolean;
  enable_social_sharing: boolean;
  featured_posts_count: number;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<BlogSettings>({
    posts_per_page: 10,
    enable_comments: true,
    default_meta_title: '',
    default_meta_description: '',
    default_meta_keywords: '',
    show_author: true,
    show_date: true,
    show_reading_time: true,
    enable_social_sharing: true,
    featured_posts_count: 3
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await callNetlifyFunction('adminBlogSettings', {
        action: 'get'
      });
      if (response.error) throw response.error;
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching blog settings:', error);
      setError('Failed to fetch blog settings');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await callNetlifyFunction('adminBlogSettings', {
        action: 'update',
        settings: settings
      });
      if (response.error) throw response.error;
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving blog settings:', error);
      setError('Failed to save blog settings');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-tan">Blog Settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-tan text-gunmetal px-4 py-2 rounded-sm flex items-center hover:bg-tan/90 transition-colors disabled:opacity-50"
        >
          <Save size={20} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-sm ${
          saveMessage.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {saveMessage.text}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-sm bg-red-500/10 text-red-500">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}

      {saveStatus && (
        <div className={`mb-6 p-4 rounded-sm ${
          saveStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {saveStatus === 'success' ? 'Settings saved successfully' : 'Failed to save settings'}
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Display Settings */}
        <div className="bg-gunmetal p-6 rounded-sm shadow-luxury mb-6">
          <h3 className="text-xl font-bold mb-4">Display Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Posts Per Page</label>
              <input
                type="number"
                value={settings.posts_per_page}
                onChange={(e) => setSettings({ ...settings, posts_per_page: parseInt(e.target.value) })}
                className="w-full bg-gunmetal-light p-2 rounded-sm"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Featured Posts Count</label>
              <input
                type="number"
                value={settings.featured_posts_count}
                onChange={(e) => setSettings({ ...settings, featured_posts_count: parseInt(e.target.value) })}
                className="w-full bg-gunmetal-light p-2 rounded-sm"
                min="0"
                max="10"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.show_author}
                onChange={(e) => setSettings({ ...settings, show_author: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Show Author</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.show_date}
                onChange={(e) => setSettings({ ...settings, show_date: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Show Publication Date</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.show_reading_time}
                onChange={(e) => setSettings({ ...settings, show_reading_time: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Show Reading Time</label>
            </div>
          </div>
        </div>

        {/* Interaction Settings */}
        <div className="bg-gunmetal p-6 rounded-sm shadow-luxury mb-6">
          <h3 className="text-xl font-bold mb-4">Interaction Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enable_comments}
                onChange={(e) => setSettings({ ...settings, enable_comments: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Enable Comments</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enable_social_sharing}
                onChange={(e) => setSettings({ ...settings, enable_social_sharing: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Enable Social Sharing</label>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-gunmetal p-6 rounded-sm shadow-luxury">
          <h3 className="text-xl font-bold mb-4">SEO Defaults</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Meta Title</label>
              <input
                type="text"
                value={settings.default_meta_title}
                onChange={(e) => setSettings({ ...settings, default_meta_title: e.target.value })}
                className="w-full bg-gunmetal-light p-2 rounded-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Meta Description</label>
              <textarea
                value={settings.default_meta_description}
                onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
                className="w-full bg-gunmetal-light p-2 rounded-sm h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Meta Keywords</label>
              <input
                type="text"
                value={settings.default_meta_keywords}
                onChange={(e) => setSettings({ ...settings, default_meta_keywords: e.target.value })}
                className="w-full bg-gunmetal-light p-2 rounded-sm"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage; 