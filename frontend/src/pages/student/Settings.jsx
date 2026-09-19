import { useState } from 'react';
import { FaSave, FaUndo, FaBell, FaLock, FaUser, FaGlobe, FaEnvelope, FaMobile, FaMoon, FaSun } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: { email: true, sms: false, system: true, academic: true, payment: true },
    preferences: { language: 'en', theme: 'light', timezone: 'Africa/Nairobi' },
    privacy: { profile_visible: true, show_email: false, show_phone: false }
  });
  const [loading, setLoading] = useState(false);

  const handleNotificationChange = (key) => {
    setSettings({ ...settings, notifications: { ...settings.notifications, [key]: !settings.notifications[key] } });
  };

  const handlePreferenceChange = (key, value) => {
    setSettings({ ...settings, preferences: { ...settings.preferences, [key]: value } });
  };

  const handlePrivacyChange = (key) => {
    setSettings({ ...settings, privacy: { ...settings.privacy, [key]: !settings.privacy[key] } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default?')) {
      setSettings({
        notifications: { email: true, sms: false, system: true, academic: true, payment: true },
        preferences: { language: 'en', theme: 'light', timezone: 'Africa/Nairobi' },
        privacy: { profile_visible: true, show_email: false, show_phone: false }
      });
      toast.success('Settings reset to default');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your account preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center"><FaBell className="mr-2 text-blue-600" /> Notification Settings</h2>
            <div className="space-y-3">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 capitalize">{key.replace('_', ' ')} Notifications</p>
                    <p className="text-sm text-gray-500">Receive {key} notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={value} onChange={() => handleNotificationChange(key)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center"><FaGlobe className="mr-2 text-blue-600" /> Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select value={settings.preferences.language} onChange={(e) => handlePreferenceChange('language', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="en">English</option><option value="sw">Swahili</option><option value="fr">French</option><option value="ar">Arabic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select value={settings.preferences.theme} onChange={(e) => handlePreferenceChange('theme', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="light">Light</option><option value="dark">Dark</option><option value="system">System Default</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select value={settings.preferences.timezone} onChange={(e) => handlePreferenceChange('timezone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Africa/Nairobi">Africa/Nairobi</option><option value="Africa/Lagos">Africa/Lagos</option><option value="Africa/Cairo">Africa/Cairo</option><option value="Africa/Johannesburg">Africa/Johannesburg</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center"><FaLock className="mr-2 text-blue-600" /> Privacy Settings</h2>
            <div className="space-y-3">
              {Object.entries(settings.privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">{key === 'profile_visible' ? 'Make your profile visible to others' : key === 'show_email' ? 'Display your email on your profile' : 'Display your phone number on your profile'}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={value} onChange={() => handlePrivacyChange(key)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={handleReset} className="flex items-center px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <FaUndo className="mr-2" /> Reset Defaults
            </button>
            <button type="submit" disabled={loading} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              <FaSave className="mr-2" /> {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;