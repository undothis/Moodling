'use client';

import { useState } from 'react';
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  RefreshCw,
  Database,
  Brain,
  FileText,
  Shield,
  Target,
  MessageSquare,
  Zap,
  Activity,
  Server,
} from 'lucide-react';
import clsx from 'clsx';

const API_BASE = 'http://localhost:8000';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
  data?: any;
}

interface TestGroup {
  name: string;
  icon: any;
  description: string;
  tests: TestConfig[];
}

interface TestConfig {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  validator?: (data: any) => string | null;
}

const testGroups: TestGroup[] = [
  {
    name: 'System Health',
    icon: Server,
    description: 'Core system endpoints and diagnostics',
    tests: [
      {
        name: 'Health Check',
        endpoint: '/',
        method: 'GET',
        validator: (data) => data.status === 'ok' ? null : 'Health check failed',
      },
      {
        name: 'Version Info',
        endpoint: '/version',
        method: 'GET',
        validator: (data) => data.version ? null : 'Missing version',
      },
      {
        name: 'Diagnostics',
        endpoint: '/diagnostics',
        method: 'GET',
        validator: (data) => data.summary ? null : 'Missing diagnostics summary',
      },
      {
        name: 'Get Logs',
        endpoint: '/logs?lines=10',
        method: 'GET',
        validator: (data) => Array.isArray(data.entries) ? null : 'Missing log entries',
      },
    ],
  },
  {
    name: 'Brain Studio - Philosophy',
    icon: FileText,
    description: 'Philosophy document management',
    tests: [
      {
        name: 'Get Philosophy',
        endpoint: '/brain-studio/philosophy',
        method: 'GET',
        validator: (data) => data.program_name ? null : 'Missing program name',
      },
      {
        name: 'Update Philosophy',
        endpoint: '/brain-studio/philosophy',
        method: 'PUT',
        body: { program_description: 'Test update from component tests' },
        validator: (data) => data.success ? null : 'Update failed',
      },
    ],
  },
  {
    name: 'Brain Studio - Tenants',
    icon: Shield,
    description: 'Core tenants/principles management',
    tests: [
      {
        name: 'Get Tenants',
        endpoint: '/brain-studio/tenants',
        method: 'GET',
        validator: (data) => Array.isArray(data.tenants) ? null : 'Missing tenants array',
      },
      {
        name: 'Create Test Tenant',
        endpoint: '/brain-studio/tenants',
        method: 'POST',
        body: {
          name: 'Test Tenant',
          description: 'This is a test tenant created by component tests',
          category: 'testing',
        },
        validator: (data) => data.success && data.tenant ? null : 'Creation failed',
      },
    ],
  },
  {
    name: 'Brain Studio - Goals',
    icon: Target,
    description: 'Brain training goals management',
    tests: [
      {
        name: 'Get Goals',
        endpoint: '/brain-studio/goals',
        method: 'GET',
        validator: (data) => Array.isArray(data.goals) ? null : 'Missing goals array',
      },
      {
        name: 'Get Brain State',
        endpoint: '/brain-studio/brain-state',
        method: 'GET',
        validator: (data) => data !== undefined ? null : 'No brain state returned',
      },
      {
        name: 'Get Brain Comparison',
        endpoint: '/brain-studio/comparison',
        method: 'GET',
        validator: (data) => 'health_score' in data ? null : 'Missing health score',
      },
    ],
  },
  {
    name: 'Brain Studio - Insights',
    icon: Brain,
    description: 'Insights and influence management',
    tests: [
      {
        name: 'Get Insights',
        endpoint: '/brain-studio/insights?limit=10',
        method: 'GET',
        validator: (data) => Array.isArray(data.insights) ? null : 'Missing insights array',
      },
      {
        name: 'Get Channel Influence',
        endpoint: '/brain-studio/influence',
        method: 'GET',
        validator: (data) => Array.isArray(data.channels) ? null : 'Missing channels array',
      },
      {
        name: 'Get Categories',
        endpoint: '/brain-studio/categories',
        method: 'GET',
        validator: (data) => Array.isArray(data.categories) ? null : 'Missing categories array',
      },
    ],
  },
  {
    name: 'Brain Studio - Compliance',
    icon: Activity,
    description: 'Compliance checking and violations',
    tests: [
      {
        name: 'Get Violations',
        endpoint: '/brain-studio/violations',
        method: 'GET',
        validator: (data) => 'violations' in data ? null : 'Missing violations',
      },
    ],
  },
  {
    name: 'Brain Studio - Prompt Lab',
    icon: MessageSquare,
    description: 'Prompt testing functionality',
    tests: [
      {
        name: 'Test Prompt',
        endpoint: '/brain-studio/prompt-lab',
        method: 'POST',
        body: {
          prompt: 'Hello, how can you help me today?',
          show_influences: true,
        },
        validator: (data) => data.response ? null : 'No response generated',
      },
    ],
  },
  {
    name: 'Channels & Videos',
    icon: Database,
    description: 'Channel and video management',
    tests: [
      {
        name: 'Get Channels',
        endpoint: '/channels',
        method: 'GET',
        validator: (data) => Array.isArray(data) ? null : 'Expected array of channels',
      },
      {
        name: 'Get Statistics',
        endpoint: '/brain-studio/statistics',
        method: 'GET',
        validator: () => null, // Just check it doesn't error
      },
      {
        name: 'Get Recommended Channels',
        endpoint: '/recommended-channels',
        method: 'GET',
        validator: (data) => Array.isArray(data) ? null : 'Expected array',
      },
    ],
  },
  {
    name: 'Processing',
    icon: Zap,
    description: 'Video processing and jobs',
    tests: [
      {
        name: 'List Jobs',
        endpoint: '/jobs',
        method: 'GET',
        validator: (data) => Array.isArray(data) ? null : 'Expected array of jobs',
      },
      {
        name: 'Get Insights List',
        endpoint: '/insights?limit=5',
        method: 'GET',
        validator: (data) => Array.isArray(data) ? null : 'Expected array of insights',
      },
    ],
  },
];

async function runTest(test: TestConfig): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method: test.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(`${API_BASE}${test.endpoint}`, options);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      return {
        name: test.name,
        status: 'error',
        message: `HTTP ${response.status}: ${response.statusText}`,
        duration,
      };
    }

    const data = await response.json();
    const validationError = test.validator ? test.validator(data) : null;

    if (validationError) {
      return {
        name: test.name,
        status: 'error',
        message: validationError,
        duration,
        data,
      };
    }

    return {
      name: test.name,
      status: 'success',
      duration,
      data,
    };
  } catch (error) {
    return {
      name: test.name,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

function TestResultCard({ result }: { result: TestResult }) {
  const [showData, setShowData] = useState(false);

  return (
    <div
      className={clsx(
        'p-3 rounded-lg border',
        result.status === 'success' && 'bg-green-50 border-green-200',
        result.status === 'error' && 'bg-red-50 border-red-200',
        result.status === 'running' && 'bg-blue-50 border-blue-200',
        result.status === 'pending' && 'bg-gray-50 border-gray-200'
      )}
    >
      <div className="flex items-center gap-2">
        {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {result.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
        {result.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        {result.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}

        <span className="font-medium text-sm">{result.name}</span>

        {result.duration !== undefined && (
          <span className="text-xs text-gray-500 ml-auto">{result.duration}ms</span>
        )}
      </div>

      {result.message && (
        <p className="text-xs text-red-600 mt-1 ml-6">{result.message}</p>
      )}

      {result.data && (
        <div className="mt-2 ml-6">
          <button
            onClick={() => setShowData(!showData)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showData ? 'Hide' : 'Show'} response data
          </button>
          {showData && (
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function TestGroupCard({
  group,
  results,
  isRunning,
  onRun,
}: {
  group: TestGroup;
  results: Record<string, TestResult>;
  isRunning: boolean;
  onRun: () => void;
}) {
  const Icon = group.icon;
  const passCount = Object.values(results).filter((r) => r.status === 'success').length;
  const failCount = Object.values(results).filter((r) => r.status === 'error').length;
  const totalTests = group.tests.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-leaf-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-leaf-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
            <p className="text-xs text-gray-500">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {passCount > 0 && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              {passCount}/{totalTests} passed
            </span>
          )}
          {failCount > 0 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
              {failCount} failed
            </span>
          )}
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-1 px-3 py-1.5 bg-leaf-500 text-white rounded-lg text-sm hover:bg-leaf-600 disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Run
          </button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {group.tests.map((test) => (
          <TestResultCard
            key={test.name}
            result={results[test.name] || { name: test.name, status: 'pending' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TestPage() {
  const [results, setResults] = useState<Record<string, Record<string, TestResult>>>({});
  const [runningGroups, setRunningGroups] = useState<Set<string>>(new Set());
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runGroupTests = async (group: TestGroup) => {
    setRunningGroups((prev) => new Set([...prev, group.name]));

    const groupResults: Record<string, TestResult> = {};

    for (const test of group.tests) {
      // Mark as running
      setResults((prev) => ({
        ...prev,
        [group.name]: {
          ...prev[group.name],
          [test.name]: { name: test.name, status: 'running' },
        },
      }));

      // Run the test
      const result = await runTest(test);
      groupResults[test.name] = result;

      // Update with result
      setResults((prev) => ({
        ...prev,
        [group.name]: {
          ...prev[group.name],
          [test.name]: result,
        },
      }));
    }

    setRunningGroups((prev) => {
      const next = new Set(prev);
      next.delete(group.name);
      return next;
    });
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const group of testGroups) {
      await runGroupTests(group);
    }
    setIsRunningAll(false);
  };

  const totalTests = testGroups.reduce((acc, g) => acc + g.tests.length, 0);
  const passedTests = Object.values(results).reduce(
    (acc, groupResults) =>
      acc + Object.values(groupResults).filter((r) => r.status === 'success').length,
    0
  );
  const failedTests = Object.values(results).reduce(
    (acc, groupResults) =>
      acc + Object.values(groupResults).filter((r) => r.status === 'error').length,
    0
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Component Tests</h1>
              <p className="text-gray-500">Test all API endpoints and Brain Studio components</p>
            </div>
          </div>
          <button
            onClick={runAllTests}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {isRunningAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running All Tests...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </button>
        </div>

        {/* Summary Bar */}
        {(passedTests > 0 || failedTests > 0) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold">{totalTests} tests</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">{passedTests} passed</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{failedTests} failed</span>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(passedTests / totalTests) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testGroups.map((group) => (
          <TestGroupCard
            key={group.name}
            group={group}
            results={results[group.name] || {}}
            isRunning={runningGroups.has(group.name)}
            onRun={() => runGroupTests(group)}
          />
        ))}
      </div>

      {/* API Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">API Connection</h3>
        <p className="text-sm text-blue-700">
          Testing against: <code className="bg-blue-100 px-1 rounded">{API_BASE}</code>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Make sure the backend server is running on port 8000.
        </p>
      </div>
    </div>
  );
}
