'use client';

import { useState, useEffect } from 'react';
import { getHelpDeskAssessment } from '@/actions/help-desk-analysis';
import type { HelpDeskAssessment } from '@/types/help-desk-analysis';
import { RESIMPLI_BENCHMARK } from '@/types/help-desk-analysis';

export default function HelpDeskAssessmentPage() {
  const [assessment, setAssessment] = useState<HelpDeskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAssessment = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getHelpDeskAssessment();

      if (result.success && result.data) {
        setAssessment(result.data);
      } else {
        setError(result.error || 'Failed to run assessment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Help Desk Assessment
              </h1>
              <p className="text-gray-600">
                Analyze your Intercom Help Center structure and compare to industry best practices
              </p>
            </div>

            <button
              onClick={runAssessment}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              {loading ? 'Running Assessment...' : 'Run Assessment'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Results */}
      {assessment && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Total Collections</div>
              <div className="text-3xl font-bold text-blue-600">{assessment.totalCollections}</div>
              <div className="text-xs text-gray-500 mt-2">
                {assessment.comparison.changes.collectionsAdded > 0 && (
                  <span className="text-green-600">+{assessment.comparison.changes.collectionsAdded} added</span>
                )}
                {assessment.comparison.changes.collectionsRemoved > 0 && (
                  <span className="text-red-600">-{assessment.comparison.changes.collectionsRemoved} removed</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Total Articles</div>
              <div className="text-3xl font-bold text-green-600">{assessment.totalArticles}</div>
              <div className="text-xs text-gray-500 mt-2">
                {assessment.comparison.changes.articlesAdded > 0 && (
                  <span className="text-green-600">+{assessment.comparison.changes.articlesAdded} added</span>
                )}
                {assessment.comparison.changes.articlesRemoved > 0 && (
                  <span className="text-red-600">-{assessment.comparison.changes.articlesRemoved} removed</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
              <div className="text-sm text-gray-600 mb-1">Dumping Ground</div>
              <div className="text-3xl font-bold text-yellow-600">
                {assessment.criticalIssues.dumpingGroundCollections.length > 0 ? (
                  `${assessment.collections[0]?.percentage.toFixed(0)}%`
                ) : (
                  '0%'
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {assessment.comparison.changes.dumpingGroundImprovement > 0 ? (
                  <span className="text-green-600">
                    ↓ {assessment.comparison.changes.dumpingGroundImprovement.toFixed(0)}% improvement
                  </span>
                ) : assessment.comparison.changes.dumpingGroundImprovement < 0 ? (
                  <span className="text-red-600">
                    ↑ {Math.abs(assessment.comparison.changes.dumpingGroundImprovement).toFixed(0)}% worse
                  </span>
                ) : (
                  <span className="text-gray-500">No change</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
              <div className="text-sm text-gray-600 mb-1">Critical Issues</div>
              <div className="text-3xl font-bold text-red-600">
                {assessment.criticalIssues.dumpingGroundCollections.length +
                  assessment.criticalIssues.duplicateArticles.length +
                  assessment.criticalIssues.misplacedArticles.length}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Needs immediate attention
              </div>
            </div>
          </div>

          {/* Comparison to Baseline */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Comparison to Original Audit</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Original (Oct 8, 2025)</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Collections:</span>
                    <span className="font-semibold">{assessment.comparison.previous.totalCollections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Articles:</span>
                    <span className="font-semibold">{assessment.comparison.previous.totalArticles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Dumping Ground:</span>
                    <span className="font-semibold text-red-600">
                      {assessment.comparison.previous.dumpingGroundPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Current State</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Collections:</span>
                    <span className="font-semibold">{assessment.totalCollections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Articles:</span>
                    <span className="font-semibold">{assessment.totalArticles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Dumping Ground:</span>
                    <span className={`font-semibold ${assessment.collections[0]?.percentage > 20 ? 'text-red-600' : 'text-green-600'}`}>
                      {assessment.collections[0]?.percentage.toFixed(0) || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-purple-50">
                <div className="text-sm text-gray-600 mb-2">REsimpli Benchmark</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Collections:</span>
                    <span className="font-semibold">{RESIMPLI_BENCHMARK.totalCollections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Articles:</span>
                    <span className="font-semibold">{RESIMPLI_BENCHMARK.totalArticles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Largest Collection:</span>
                    <span className="font-semibold text-green-600">
                      {RESIMPLI_BENCHMARK.largestCollectionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Issues */}
          {(assessment.criticalIssues.dumpingGroundCollections.length > 0 ||
            assessment.criticalIssues.duplicateArticles.length > 0 ||
            assessment.criticalIssues.misplacedArticles.length > 0) && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🚨 Critical Issues</h2>

              {/* Dumping Ground Collections */}
              {assessment.criticalIssues.dumpingGroundCollections.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Dumping Ground Collections (&gt;20% of articles)</h3>
                  <div className="space-y-2">
                    {assessment.criticalIssues.dumpingGroundCollections.map((collectionName) => {
                      const collection = assessment.collections.find(c => c.collection.name === collectionName);
                      return (
                        <div key={collectionName} className="flex items-center justify-between bg-red-50 p-4 rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-800">{collectionName}</div>
                            <div className="text-sm text-gray-600">
                              {collection?.articles.length} articles ({collection?.percentage.toFixed(1)}% of total)
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {collection?.percentage.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duplicate Articles */}
              {assessment.criticalIssues.duplicateArticles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-orange-600 mb-3">Duplicate Articles</h3>
                  <div className="space-y-2">
                    {assessment.criticalIssues.duplicateArticles.map((dup, index) => (
                      <div key={index} className="bg-orange-50 p-4 rounded-lg">
                        <div className="font-semibold text-gray-800">{dup.title}</div>
                        <div className="text-sm text-gray-600">
                          {dup.count} duplicates found (IDs: {dup.ids.join(', ')})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Misplaced Articles */}
              {assessment.criticalIssues.misplacedArticles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-600 mb-3">
                    Misplaced Articles ({assessment.criticalIssues.misplacedArticles.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {assessment.criticalIssues.misplacedArticles.slice(0, 10).map((item, index) => (
                      <div key={index} className="bg-yellow-50 p-4 rounded-lg">
                        <div className="font-semibold text-gray-800">{item.article}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Currently in: <span className="font-medium">{item.currentCollection}</span>
                          {' → '}
                          Should be in: <span className="font-medium text-green-600">{item.suggestedCollection}</span>
                        </div>
                      </div>
                    ))}
                    {assessment.criticalIssues.misplacedArticles.length > 10 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        ... and {assessment.criticalIssues.misplacedArticles.length - 10} more misplaced articles
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collections Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Collections Breakdown</h2>

            <div className="space-y-4">
              {assessment.collections.map((collection, index) => (
                <div
                  key={collection.collection.id}
                  className={`border rounded-lg p-6 ${
                    collection.percentage > 20 ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {index + 1}. {collection.collection.name}
                      </h3>
                      <p className="text-sm text-gray-600">{collection.collection.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">{collection.articles.length}</div>
                      <div className="text-sm text-gray-500">{collection.percentage.toFixed(1)}% of total</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full ${
                        collection.percentage > 20 ? 'bg-red-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(collection.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Issues */}
                  {collection.issues.length > 0 && (
                    <div className="space-y-1">
                      {collection.issues.map((issue, i) => (
                        <div key={i} className="flex items-start text-sm">
                          <span className="text-red-500 mr-2">⚠️</span>
                          <span className="text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">💡 Recommendations</h2>

            <div className="space-y-4">
              {assessment.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-gray-800">{recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Naming Issues (if any) */}
          {assessment.criticalIssues.namingIssues.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                ✏️ Naming Issues ({assessment.criticalIssues.namingIssues.length})
              </h2>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assessment.criticalIssues.namingIssues.slice(0, 20).map((naming, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-800">{naming.article}</div>
                    <div className="text-xs text-gray-600 mt-1">{naming.issues.join(', ')}</div>
                  </div>
                ))}
                {assessment.criticalIssues.namingIssues.length > 20 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    ... and {assessment.criticalIssues.namingIssues.length - 20} more naming issues
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500">
            Assessment run at: {new Date(assessment.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Initial State */}
      {!assessment && !loading && !error && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Assess Your Help Desk</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Click &ldquo;Run Assessment&rdquo; to analyze your current Intercom Help Center structure and compare it to your original audit from October 8, 2025.
              The assessment will identify dumping ground collections, duplicate articles, misplaced content, and provide actionable recommendations.
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-purple-900 mb-3">What This Assessment Includes:</h3>
              <ul className="text-left text-gray-700 space-y-2">
                <li>✅ Collection and article count analysis</li>
                <li>✅ Dumping ground detection (collections with &gt;20% of articles)</li>
                <li>✅ Duplicate article identification</li>
                <li>✅ Misplaced article detection</li>
                <li>✅ Article naming issue analysis</li>
                <li>✅ Comparison to original audit baseline</li>
                <li>✅ Comparison to REsimpli industry benchmark</li>
                <li>✅ Actionable recommendations for improvement</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
