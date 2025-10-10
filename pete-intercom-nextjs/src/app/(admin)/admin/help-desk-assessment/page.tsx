'use client';

import { useState, useEffect } from 'react';
import { getHelpDeskAssessment } from '@/actions/help-desk-analysis';
import type { HelpDeskAssessment } from '@/types/help-desk-analysis';
import { RESIMPLI_BENCHMARK } from '@/types/help-desk-analysis';
import competitorData from '@/data/competitor-benchmark.json';

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

          {/* Detailed Comparison: REsimpli vs Pete */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Detailed Comparison: REsimpli vs Pete</h2>

            {/* Organization Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                <h3 className="text-lg font-bold text-green-700 mb-3">✅ REsimpli Strategy</h3>
                <p className="text-gray-700 mb-4 font-medium">{competitorData.resimpli.organizationStrategy}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Organizing Principles:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {competitorData.resimpli.organizingPrinciples.map((principle, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                <h3 className="text-lg font-bold text-red-700 mb-3">❌ Pete Current State</h3>
                <p className="text-gray-700 mb-4 font-medium">Unfocused organization with massive dumping ground</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">Critical Issues:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {competitorData.pete_original_baseline.criticalIssues.slice(0, 6).map((issue, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-600 mr-2">⚠️</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Process Flow Comparison */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 User Journey: What Do Users Do First?</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* REsimpli Flow */}
                <div className="border rounded-lg p-6">
                  <h4 className="font-bold text-green-700 mb-4">REsimpli User Journey</h4>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
                      <div>
                        <div className="font-semibold text-gray-800">Getting Started (17 articles)</div>
                        <div className="text-sm text-gray-600">Onboarding & initial setup</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
                      <div>
                        <div className="font-semibold text-gray-800">Leads (32 articles)</div>
                        <div className="text-sm text-gray-600">Core feature - everything about leads</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
                      <div>
                        <div className="font-semibold text-gray-800">Communication & Automation</div>
                        <div className="text-sm text-gray-600">Drip campaigns (8), Phone numbers (14)</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">4</div>
                      <div>
                        <div className="font-semibold text-gray-800">Disposition (21 articles)</div>
                        <div className="text-sm text-gray-600">Advanced - selling properties</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pete Current Flow */}
                <div className="border rounded-lg p-6 bg-red-50">
                  <h4 className="font-bold text-red-700 mb-4">Pete Current Journey (Broken)</h4>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
                      <div>
                        <div className="font-semibold text-gray-800">Getting Started (9 articles)</div>
                        <div className="text-sm text-red-600">❌ Wrong order, duplicates, missing core tasks</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
                      <div>
                        <div className="font-semibold text-gray-800">??? No Lead Management</div>
                        <div className="text-sm text-red-600">❌ Missing entire collection - articles scattered</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
                      <div>
                        <div className="font-semibold text-gray-800">Support (24 articles - 41%!)</div>
                        <div className="text-sm text-red-600">❌ DUMPING GROUND - date-stamped titles, no organization</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mr-3">4</div>
                      <div>
                        <div className="font-semibold text-gray-800">User gets lost...</div>
                        <div className="text-sm text-red-600">❌ Content scattered across Training, Properties, Tasks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Comparison Table */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Collection-by-Collection Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Category</th>
                      <th className="border p-3 text-left">REsimpli</th>
                      <th className="border p-3 text-left">Pete Current</th>
                      <th className="border p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-3 font-semibold">Getting Started</td>
                      <td className="border p-3">17 articles - onboarding focused</td>
                      <td className="border p-3">9 articles - has duplicates</td>
                      <td className="border p-3 text-yellow-600">⚠️ Needs work</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border p-3 font-semibold">Lead Management</td>
                      <td className="border p-3">32 articles - "Leads" collection</td>
                      <td className="border p-3 text-red-600">MISSING - scattered in Properties</td>
                      <td className="border p-3 text-red-600">❌ Critical gap</td>
                    </tr>
                    <tr>
                      <td className="border p-3 font-semibold">Communication</td>
                      <td className="border p-3">Phone (14), Drip (8) = 22 articles</td>
                      <td className="border p-3">8 articles - email setup in Support!</td>
                      <td className="border p-3 text-yellow-600">⚠️ Incomplete</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border p-3 font-semibold">Workflows & Automation</td>
                      <td className="border p-3">Status Automations in General</td>
                      <td className="border p-3 text-red-600">1 article - wrong content!</td>
                      <td className="border p-3 text-red-600">❌ Broken</td>
                    </tr>
                    <tr>
                      <td className="border p-3 font-semibold">General/Cross-Module</td>
                      <td className="border p-3">41 articles (10%) - well-organized</td>
                      <td className="border p-3 text-red-600">24 articles (41%) - DUMPING GROUND</td>
                      <td className="border p-3 text-red-600">❌ Major issue</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border p-3 font-semibold">Integrations</td>
                      <td className="border p-3">11 articles</td>
                      <td className="border p-3">1 article</td>
                      <td className="border p-3 text-red-600">❌ Severely lacking</td>
                    </tr>
                  </tbody>
                </table>
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
                    <div className="space-y-1 mb-4">
                      {collection.issues.map((issue, i) => (
                        <div key={i} className="flex items-start text-sm">
                          <span className="text-red-500 mr-2">⚠️</span>
                          <span className="text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Articles List */}
                  {collection.articles.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-700">
                        📄 View {collection.articles.length} articles
                      </summary>
                      <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                        {collection.articles.map((article) => (
                          <div key={article.id} className="text-xs text-gray-600 pl-4 py-1 hover:bg-gray-50 rounded">
                            • {article.title}
                          </div>
                        ))}
                      </div>
                    </details>
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
