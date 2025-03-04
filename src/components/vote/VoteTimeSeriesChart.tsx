'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation } from '@/components/location/LocationContext';

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      timestamp: string;
      rawValue: number;
      avgValue: number;
    };
  }>;
  label?: string;
}

interface VoteTimeSeriesChartProps {
  subjectId: string;
  locationId?: string;
  days?: number;
}

export function VoteTimeSeriesChart({ 
  subjectId, 
  locationId, 
  days = 30 
}: VoteTimeSeriesChartProps) {
  const { selectedLocation } = useLocation();
  const effectiveLocationId = locationId || (selectedLocation?.id);
  
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [runningAverage, setRunningAverage] = useState<TimeSeriesDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeSeriesData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('subject_id', subjectId);
        queryParams.set('days', days.toString());
        
        if (effectiveLocationId) {
          queryParams.set('location_id', effectiveLocationId);
        }

        const response = await fetch(`/api/votes/time-series?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch votes time series data');
        }
        
        const data = await response.json();
        setTimeSeriesData(data.timeSeriesData);
        setRunningAverage(data.runningAverage);
      } catch (err) {
        console.error('Error fetching votes time series:', err);
        setError('Failed to load voting time series');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeSeriesData();
  }, [subjectId, effectiveLocationId, days]);

  // Format date for tooltip and X-axis
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Custom tooltip to show date and value
  const CustomTooltip = ({ active, payload }: TooltipContentProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{formatDate(payload[0].payload.timestamp)}</p>
          <p className="text-blue-500">
            Raw Value: {payload[0].value === 1 ? 'Positive' : 'Negative'}
          </p>
          {payload.length > 1 && (
            <p className="text-green-500">
              Running Avg: {(payload[1].value * 100).toFixed(0)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Loading chart data...</div>;
  }

  if (error) {
    return <div className="h-40 flex items-center justify-center text-sm text-red-500">{error}</div>;
  }

  // If there's no data, show a message
  if (timeSeriesData.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        No vote data available for the selected time period
      </div>
    );
  }

  // Format data for chart - we need an array of {timestamp, rawValue, avgValue}
  const chartData = timeSeriesData.map((point, index) => ({
    timestamp: point.timestamp,
    rawValue: point.value,
    avgValue: runningAverage[index]?.value || 0
  }));

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatDate}
            tick={{ fontSize: 10 }}
            tickCount={5}
          />
          <YAxis 
            domain={[0, 1]} 
            tickCount={2}
            tick={{ fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="stepAfter" 
            dataKey="rawValue" 
            stroke="transparent"
            dot={{ 
              r: 3, 
              fill: "#8884d8", 
              strokeWidth: 1 
            }}
            name="Raw Votes"
          />
          <Line 
            type="monotone" 
            dataKey="avgValue" 
            stroke="#82ca9d" 
            strokeWidth={2}
            dot={false} 
            name="Running Average" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 