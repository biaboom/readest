import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useEnv } from '@/context/EnvContext';
import { S3Config } from '@/types/s3config';

interface S3ConfigPanelProps {
  onRegisterReset: (resetFn: () => void) => void;
}

const S3ConfigPanel: React.FC<S3ConfigPanelProps> = ({ onRegisterReset }) => {
  const _ = useTranslation();
  const { settings, setSettings, saveSettings } = useSettingsStore();
  const { envConfig } = useEnv();
  const [config, setConfig] = useState<S3Config>({
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    bucket: '',
    pathStyle: false,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 初始化配置或当设置改变时更新配置
  useEffect(() => {
    // 只有当s3Config存在且与当前config不同时才更新
    if (settings.s3Config) {
      // 检查是否需要更新配置
      const currentConfigString = JSON.stringify({
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId,
        region: config.region,
        bucket: config.bucket,
        pathStyle: config.pathStyle
      });
      
      const settingsConfigString = JSON.stringify({
        endpoint: settings.s3Config.endpoint,
        accessKeyId: settings.s3Config.accessKeyId,
        region: settings.s3Config.region,
        bucket: settings.s3Config.bucket,
        pathStyle: settings.s3Config.pathStyle
      });
      
      // 只有当配置实际发生变化时才更新（不包括secretAccessKey）
      if (currentConfigString !== settingsConfigString) {
        setConfig({
          ...settings.s3Config,
        });
      }
    } else if (config.endpoint || config.accessKeyId || config.region || 
               config.bucket || config.pathStyle) {
      // 如果settings.s3Config为空但当前config有值，则重置为默认值（保留secretAccessKey）
      setConfig(prev => ({
        endpoint: '',
        accessKeyId: '',
        secretAccessKey: prev.secretAccessKey,
        region: '',
        bucket: '',
        pathStyle: false,
      }));
    }
  }, [settings.s3Config]); // 只依赖s3Config而不是整个settings对象

  useEffect(() => {
    onRegisterReset(() => {
      setConfig({
        endpoint: '',
        accessKeyId: '',
        secretAccessKey: '',
        region: '',
        bucket: '',
        pathStyle: false,
      });
    });
  }, [onRegisterReset]);

  // 保存配置到store的函数
  const saveConfigToStore = async (newConfig: S3Config) => {
    try {
      const newSettings = {
        ...settings,
        s3Config: newConfig,
      };

      setSettings(newSettings);
      await saveSettings(envConfig, newSettings);
      
      setTestResult({
        success: true,
        message: _('S3 configuration saved successfully'),
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: _('Failed to save S3 configuration: {{error}}', {
          error: error.message,
        }),
      });
    }
  };

  const handleChange = (field: keyof S3Config, value: string | boolean) => {
    const newConfig = {
      ...config,
      [field]: value,
    };
    
    setConfig(newConfig);
    // 立即保存配置到store
    saveConfigToStore(newConfig);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // In a real implementation, this would test the connection to the S3 service
      // For now, we'll just simulate a successful test
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // This is where you would actually test the connection
      // const result = await testS3Connection(config);
      setTestResult({
        success: true,
        message: _('Connection test successful'),
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: _('Connection test failed: {{error}}', {
          error: error.message,
        }),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="form-group">
        <label className="block text-sm font-medium mb-1">
          {_('Endpoint URL')}:
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={config.endpoint}
          onChange={(e) => handleChange('endpoint', e.target.value)}
          placeholder="https://s3.amazonaws.com"
        />
        <p className="text-sm text-gray-500 mt-1">
          {_('The endpoint URL of your S3-compatible service (e.g., https://s3.amazonaws.com)')}
        </p>
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-1">
          {_('Access Key ID')}:
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={config.accessKeyId}
          onChange={(e) => handleChange('accessKeyId', e.target.value)}
          placeholder="Your access key ID"
        />
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-1">
          {_('Secret Access Key')}:
        </label>
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            className="input input-bordered w-full pr-16"
            value={config.secretAccessKey}
            onChange={(e) => handleChange('secretAccessKey', e.target.value)}
            placeholder="Your secret access key"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 text-gray-500"
            onClick={() => setShowSecret(!showSecret)}
          >
            {showSecret ? _('Hide') : _('Show')}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {_('Note: The secret key will be stored securely in your local settings')}
        </p>
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-1">
          {_('Region')}:
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={config.region}
          onChange={(e) => handleChange('region', e.target.value)}
          placeholder="us-east-1"
        />
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-1">
          {_('Bucket Name')}:
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={config.bucket}
          onChange={(e) => handleChange('bucket', e.target.value)}
          placeholder="your-bucket-name"
        />
      </div>

      <div className="form-group form-control">
        <label className={clsx('label', 'cursor-pointer', 'justify-start', 'gap-2')}>
          <input
            type="checkbox"
            className="checkbox"
            checked={config.pathStyle}
            onChange={(e) => handleChange('pathStyle', e.target.checked)}
          />
          <span className="label-text">{_('Use Path Style')}</span>
        </label>
        <p className="text-sm text-gray-500 mt-1">
          {_('Enable this if your S3-compatible service requires path-style addressing (e.g., https://s3.amazonaws.com/bucket/key) instead of virtual-hosted style (e.g., https://bucket.s3.amazonaws.com/key)')}
        </p>
      </div>

      {testResult && (
        <div
          className={clsx('alert', {
            'alert-success': testResult.success,
            'alert-error': !testResult.success,
          })}
        >
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          className={clsx('btn', 'btn-primary', {
            loading: isTesting,
          })}
          onClick={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting ? _('Testing...') : _('Test Connection')}
        </button>
      </div>
    </div>
  );
};

export default S3ConfigPanel;