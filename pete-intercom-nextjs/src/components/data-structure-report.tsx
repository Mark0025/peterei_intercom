'use client';

/**
 * Data Structure Report Component
 *
 * Displays NLP analysis results of uploaded data
 * Shows objects, fields, quality metrics, and issues
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingUp,
  Database,
  FileText,
  AlertTriangle
} from 'lucide-react';
import type { DataStructureAnalysis, QualityIssue } from '@/types/nlp-analysis';

interface DataStructureReportProps {
  analysis: DataStructureAnalysis;
  onStartQuestionnaire: () => void;
  onViewDetails?: () => void;
}

export default function DataStructureReport({
  analysis,
  onStartQuestionnaire,
  onViewDetails
}: DataStructureReportProps) {
  const { objects, dataQuality, patterns, processingTime } = analysis;

  // Calculate summary stats
  const totalFields = objects.reduce((sum, obj) => sum + obj.fields.length, 0);
  const totalRows = objects.reduce((sum, obj) => sum + obj.rowCount, 0);

  // Group issues by severity
  const criticalIssues = dataQuality.issues.filter(i => i.severity === 'critical');
  const warningIssues = dataQuality.issues.filter(i => i.severity === 'warning');
  const infoIssues = dataQuality.issues.filter(i => i.severity === 'info');

  // Quality score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Data Structure Analysis
        </h2>
        <p className="text-muted-foreground">
          Analyzed in {processingTime}ms • {totalRows.toLocaleString()} rows • {totalFields} fields
        </p>
      </div>

      {/* Overall Quality Score */}
      <Card className={getScoreBg(dataQuality.overallScore)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Data Quality</CardTitle>
              <CardDescription>
                Based on completeness, validity, and consistency
              </CardDescription>
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(dataQuality.overallScore)}`}>
              {dataQuality.overallScore}
              <span className="text-2xl">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completeness</span>
                <span className="font-medium">{dataQuality.completenessScore}/100</span>
              </div>
              <Progress value={dataQuality.completenessScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Validity</span>
                <span className="font-medium">{dataQuality.validityScore}/100</span>
              </div>
              <Progress value={dataQuality.validityScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Consistency</span>
                <span className="font-medium">{dataQuality.consistencyScore}/100</span>
              </div>
              <Progress value={dataQuality.consistencyScore} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objects Identified */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Objects Identified
          </CardTitle>
          <CardDescription>
            Tables and entities detected in your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {objects.map((obj, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{obj.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {obj.rowCount.toLocaleString()} rows • {obj.fields.length} fields
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Math.round(obj.confidence * 100)}% confidence
                  </Badge>
                </div>

                {/* Field Types Summary */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    obj.fields.reduce((acc, field) => {
                      acc[field.inferredType] = (acc[field.inferredType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <Badge key={type} variant="secondary">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Issues */}
      {dataQuality.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Data Quality Issues
            </CardTitle>
            <CardDescription>
              {criticalIssues.length} critical • {warningIssues.length} warnings • {infoIssues.length} info
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Critical Issues */}
              {criticalIssues.map((issue, idx) => (
                <IssueCard key={`critical-${idx}`} issue={issue} />
              ))}

              {/* Warning Issues */}
              {warningIssues.map((issue, idx) => (
                <IssueCard key={`warning-${idx}`} issue={issue} />
              ))}

              {/* Info Issues (collapsed by default) */}
              {infoIssues.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Show {infoIssues.length} informational items
                  </summary>
                  <div className="space-y-2 mt-2">
                    {infoIssues.map((issue, idx) => (
                      <IssueCard key={`info-${idx}`} issue={issue} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {dataQuality.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Suggested improvements for data quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dataQuality.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Patterns Detected */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Patterns Detected
            </CardTitle>
            <CardDescription>
              Structural patterns in your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.map((pattern, idx) => (
                <div key={idx} className="border-l-4 border-purple-500 pl-4">
                  <p className="font-medium">{pattern.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Evidence: {pattern.evidence.join(', ')}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {Math.round(pattern.confidence * 100)}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        {onViewDetails && (
          <Button variant="outline" onClick={onViewDetails}>
            View Detailed Report
          </Button>
        )}
        <Button
          onClick={onStartQuestionnaire}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Start Dynamic Questionnaire →
        </Button>
      </div>
    </div>
  );
}

/**
 * Individual Issue Card Component
 */
function IssueCard({ issue }: { issue: QualityIssue }) {
  const getSeverityIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Alert className={getSeverityColor(issue.severity)}>
      <div className="flex items-start gap-3">
        {getSeverityIcon(issue.severity)}
        <div className="flex-1">
          <AlertTitle className="text-sm font-medium">
            {issue.objectName}.{issue.field}
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {issue.issue}
            {issue.affectedRows > 0 && (
              <span className="block mt-1 text-xs">
                Affects {issue.affectedRows.toLocaleString()} rows
              </span>
            )}
            {issue.example && (
              <code className="block mt-1 text-xs bg-white/50 px-2 py-1 rounded">
                Example: {issue.example}
              </code>
            )}
          </AlertDescription>
          {issue.suggestedResolution && (
            <Badge variant="outline" className="mt-2">
              {issue.suggestedResolution}
            </Badge>
          )}
        </div>
      </div>
    </Alert>
  );
}