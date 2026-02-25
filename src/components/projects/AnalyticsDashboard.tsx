"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useAnalytics, type DateRange } from "@/lib/projects/use-analytics";
import { TrendingUp, TrendingDown, Users, Star, MessageSquare, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

/**
 * Props for the AnalyticsDashboard component.
 */
interface AnalyticsDashboardProps {
  /** UUID of the project to display analytics for */
  projectId: string;
}

/**
 * Analytics dashboard component for FeedbackPulse v2 projects.
 * Displays comprehensive feedback metrics, charts, and filtering capabilities.
 * 
 * Features:
 * - Date range filtering with preset options (7, 30, 90 days) and custom ranges
 * - Key metrics cards showing totals and trends
 * - Time-series chart showing feedback volume and rating trends
 * - Sentiment breakdown pie chart
 * - Recent feedback preview
 * 
 * @param props - Component props including projectId
 * @returns Rendered analytics dashboard with interactive elements
 */
export function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  // Date range state for filtering analytics data
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date() // Today
  });

  // Fetch analytics data with current date range filter
  const { data, isLoading, error, isUnauthorized } = useAnalytics(projectId, dateRange);

  // Handle authentication requirement
  if (isUnauthorized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Please sign in to view analytics data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Loading analytics data...</CardDescription>
          </CardHeader>
        </Card>
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription className="text-red-600">
            Error loading analytics data. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handle missing data
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>No analytics data available for this project.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Colors for sentiment pie chart
  const sentimentColors = {
    positive: "#10b981", // green
    neutral: "#6b7280", // gray
    negative: "#ef4444"  // red
  };

  // Prepare sentiment data for pie chart
  const sentimentData = [
    { name: "Positive", value: data.sentimentBreakdown.positive, color: sentimentColors.positive },
    { name: "Neutral", value: data.sentimentBreakdown.neutral, color: sentimentColors.neutral },
    { name: "Negative", value: data.sentimentBreakdown.negative, color: sentimentColors.negative }
  ].filter(item => item.value > 0); // Only show non-zero segments

  return (
    <div className="space-y-6">
      {/* Header with date range picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive feedback insights and trends
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalFeedback.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.feedbackGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={data.feedbackGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(data.feedbackGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageRating.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.ratingTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={data.ratingTrend >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(data.ratingTrend).toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.sentimentBreakdown.positive / Math.max(data.totalFeedback, 1)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.sentimentBreakdown.positive} positive responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalFeedback > 0 ? "Active" : "No Data"}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Feedback Trends</CardTitle>
            <CardDescription>
              Volume and rating trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis yAxisId="feedback" orientation="left" fontSize={12} />
                <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [
                    name === "feedback" ? value : Number(value).toFixed(1),
                    name === "feedback" ? "Feedback Count" : "Avg Rating"
                  ]}
                />
                <Line 
                  yAxisId="feedback"
                  type="monotone" 
                  dataKey="feedback" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  yAxisId="rating"
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>
              Distribution of feedback sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            Latest feedback submissions in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentFeedback.length > 0 ? (
              data.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < feedback.rating ? "fill-current" : ""}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {feedback.userEmail || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{feedback.content}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No feedback available for the selected period.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}