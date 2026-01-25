'use client';

import { useState } from 'react';
import { FlaskConical, AlertTriangle, ExternalLink, Info, Lightbulb } from 'lucide-react';

export default function TestModelPage() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Test Model</h1>
        <p className="text-gray-500 mt-1">
          Testing strategy for fine-tuned models
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-2">
              Testing Should Happen in MoodLeaf, Not Here
            </h3>
            <p className="text-amber-700 text-sm mb-3">
              A test panel in Training Studio would be misleading because:
            </p>
            <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside ml-2">
              <li>MoodLeaf has system prompts and persona that shape responses</li>
              <li>MoodLeaf has exclusion rules and safety filters</li>
              <li>MoodLeaf has memory and conversation context</li>
              <li>Testing without these would show different behavior than the real app</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Training Studio's Role */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-500" />
          What Training Studio Does
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">Data Curation</p>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Harvest insights from YouTube interviews</li>
              <li>• Score quality and safety</li>
              <li>• Review and approve/reject</li>
              <li>• Track data provenance</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Tuning Controls</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Adjust channel influence weights</li>
              <li>• Remove problematic sources</li>
              <li>• Balance category distribution</li>
              <li>• Export with weights applied</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testing Workflow */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Recommended Testing Workflow
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-leaf-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-leaf-700 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Export Training Data</p>
              <p className="text-sm text-gray-500">
                Export approved insights in Alpaca format from the Export page
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-leaf-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-leaf-700 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Fine-tune Llama</p>
              <p className="text-sm text-gray-500">
                Use the exported data to fine-tune your local Llama model
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-leaf-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-leaf-700 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Test in MoodLeaf App</p>
              <p className="text-sm text-gray-500">
                Point MoodLeaf to your fine-tuned model and test real conversations
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-leaf-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-leaf-700 font-bold text-sm">4</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Trace Issues Back</p>
              <p className="text-sm text-gray-500">
                If behavior is off, use source tokens to find which training data caused it
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-leaf-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-leaf-700 font-bold text-sm">5</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Adjust & Re-export</p>
              <p className="text-sm text-gray-500">
                Remove bad data or adjust weights in Tuning, then re-export and retrain
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Source Token Tracing */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Using Source Tokens for Debugging
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Every exported training example includes a source token that traces back to:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm mb-4">
          <p className="text-gray-500">Example token:</p>
          <p className="text-gray-900">ch1a2b3c_vdQ8K9x_i7f8e9a</p>
          <p className="text-gray-500 mt-2">Decodes to:</p>
          <p className="text-gray-700">Channel: 1a2b3c... | Video: dQ8K9x... | Insight: 7f8e9a...</p>
        </div>
        <p className="text-sm text-gray-600">
          If your model says something problematic, search for similar patterns in the Tuning page's
          source token list to find which video/channel contributed that behavior. Then you can
          delete that source or reduce its influence weight.
        </p>
      </div>
    </div>
  );
}
