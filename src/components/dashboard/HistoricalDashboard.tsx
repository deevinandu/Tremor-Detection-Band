
import React, { useEffect, useState } from 'react';
import { getHistoricalData } from '@/services/api';
import { TremorData } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  Line, 
  LineChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';

const HistoricalDashboard: React.FC = () => {
  const [data, setData] = useState<TremorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const historicalData = await getHistoricalData();
      setData(historicalData);
      setError(null);
      if (historicalData.length === 0) {
        toast.info('No historical data found');
      }
    } catch (err) {
      setError('Failed to fetch historical data. Please try again later.');
      toast.error('Failed to fetch historical data');
      console.error('Error fetching historical data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format date/time for charts and tables
  const formatDateTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatFullDateTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Prepare data for charts - reverse to show oldest to newest
  const chartData = [...data].reverse().map(item => ({
    ...item,
    time: formatDateTime(item.created_at),
    fullTime: formatFullDateTime(item.created_at),
    // Convert boolean to number for easier charting
    tremor: item.is_tremor ? 1 : 0
  }));

  // Calculate summary stats
  const tremorEvents = data.filter(item => item.is_tremor).length;
  const avgHeartRate = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.avg_bpm, 0) / data.length) 
    : 0;

  // Filter only tremor events for the event log and limit to 25 entries
  const tremorEventsList = data.filter(item => item.is_tremor).slice(0, 25);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historical Data Analysis</h2>
        <Button 
          onClick={fetchData} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {loading && data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No historical data available</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Tremor Events</h3>
              <p className="text-3xl font-bold">{tremorEvents}</p>
              <p className="text-sm text-gray-500 mt-1">Total detected events</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Average Heart Rate</h3>
              <p className="text-3xl font-bold">{avgHeartRate} <span className="text-base font-normal">BPM</span></p>
              <p className="text-sm text-gray-500 mt-1">Across all recordings</p>
            </Card>
          </div>

          {/* Motion parameters chart - Adjust height based on data points */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Motion Parameters Over Time</h3>
            <div className={`h-${Math.min(Math.max(chartData.length * 2, 64), 96)}`}>
              <ChartContainer config={{ primary: {}, accel: {}, gyro: {}, intensity: {} }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      scale="auto" 
                      interval="preserveStartEnd"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="accel_rms" 
                      name="Accel RMS" 
                      stroke="#8884d8" 
                      fill="#8884d8"
                      fillOpacity={0.2}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="gyro_rms" 
                      name="Gyro RMS" 
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="accel_intensity" 
                      name="Accel Intensity" 
                      stroke="#ff7300"
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="gyro_intensity" 
                      name="Gyro Intensity" 
                      stroke="#0088FE"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="tremor"
                      name="Tremor Event"
                      stroke="#ff0000"
                      fill="#ff0000"
                      fillOpacity={0.3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>

          {/* Biometrics chart - Adjust height based on data points */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Physiological Parameters</h3>
            <div className={`h-${Math.min(Math.max(chartData.length * 1.8, 60), 80)}`}>
              <ChartContainer config={{ primary: {}, gsr: {}, bpm: {} }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      scale="auto" 
                      interval="preserveStartEnd"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="avg_bpm" 
                      name="Heart Rate (BPM)" 
                      stroke="#ff0000" 
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="gsr" 
                      name="GSR" 
                      stroke="#0088FE" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>

          {/* Tremor event log - Limited to 25 entries */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Tremor Event Log (Latest 25)</h3>
            {tremorEventsList.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Accel RMS</TableHead>
                      <TableHead>Gyro RMS</TableHead>
                      <TableHead>Heart Rate</TableHead>
                      <TableHead>GSR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tremorEventsList.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{formatFullDateTime(event.created_at)}</TableCell>
                        <TableCell>{event.accel_rms.toFixed(2)}</TableCell>
                        <TableCell>{event.gyro_rms.toFixed(2)}</TableCell>
                        <TableCell>{event.avg_bpm}</TableCell>
                        <TableCell>{event.gsr}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No tremor events detected in this period</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
        <p className="text-sm font-medium">{payload[0]?.payload?.fullTime || label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value?.toFixed ? entry.value.toFixed(2) : entry.value}`}
            </p>
          ))}
          {payload[0]?.payload?.is_tremor && (
            <p className="text-sm font-medium text-red-500">Tremor Detected</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default HistoricalDashboard;
