import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, TrendingUp, Calendar, Users, BarChart3, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  insights: string;
  chartData: any[];
  rawData: string;
  timeframe: string;
  analysisType: string;
  timestamp?: string;
}

const AIAnalyzer = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30days');
  const [selectedAnalysis, setSelectedAnalysis] = useState('attendance');

  const generateInsights = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analyzer', {
        body: {
          userId: profile.user_id,
          userRole: profile.role,
          analysisType: selectedAnalysis,
          timeframe: selectedTimeframe
        }
      });

      if (error) throw error;

      setInsights(data);
      toast({
        title: "Analysis Complete",
        description: "AI insights have been generated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate AI insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#ef4444', '#f97316'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Analyzer</h1>
            <p className="text-muted-foreground">
              Get intelligent insights about your {profile?.role === 'student' ? 'academic progress' : 
              profile?.role === 'teacher' ? 'class performance' :
              profile?.role === 'parent' ? "child's progress" : 'institutional data'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your analysis parameters and get AI-powered insights
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Analysis Type</label>
              <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Analysis</SelectItem>
                  <SelectItem value="performance">Academic Performance</SelectItem>
                  <SelectItem value="engagement">Class Engagement</SelectItem>
                  {profile?.role === 'admin' && (
                    <SelectItem value="institutional">Institution Overview</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Frame</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 3 Months</SelectItem>
                  <SelectItem value="semester">This Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateInsights} 
              disabled={loading}
              className="self-end"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {insights && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-sm text-muted-foreground mb-4">
                  Analysis Period: {insights.timeframe} • Generated: {new Date(insights.timestamp).toLocaleString()}
                </p>
                <div className="whitespace-pre-line text-foreground leading-relaxed">
                  {insights.insights}
                </div>
              </div>
            </CardContent>
          </Card>

          {insights.chartData && insights.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Data Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Line Chart for Trends */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Attendance Trend</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={insights.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="attendance" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart for Comparison */}
                  <div>
                    <h4 className="text-sm font-medium mb-4">Status Breakdown</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={insights.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="present" fill="hsl(var(--primary))" name="Present" />
                        <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                        <Bar dataKey="late" fill="#f97316" name="Late" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Analysis Period</p>
                    <p className="text-lg font-bold capitalize">{insights.timeframe.replace('days', ' Days')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Brain className="w-8 h-8 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Analysis Type</p>
                    <p className="text-lg font-bold capitalize">{insights.analysisType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data Points</p>
                    <p className="text-lg font-bold">{insights.chartData?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!insights && (
        <Card>
          <CardContent className="p-20 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Generate Your First Analysis</h3>
            <p className="text-muted-foreground">
              Click "Generate Insights" above to get AI-powered analysis of your data.
              Our AI will analyze patterns, trends, and provide actionable recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalyzer;