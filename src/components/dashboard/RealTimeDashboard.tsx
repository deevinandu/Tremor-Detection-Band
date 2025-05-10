
import React, { useEffect, useState } from 'react';
import { getLatestData } from '@/services/api';
import { TremorData } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { ArrowRight, ThermometerSun, CircleArrowDown, Bell } from 'lucide-react';

// Define base GSR level
const BASE_GSR_LEVEL = 995;

const RealTimeDashboard: React.FC = () => {
  const [data, setData] = useState<TremorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const latestData = await getLatestData();
      setData(latestData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      toast.error('Failed to fetch data');
      console.error('Error fetching real-time data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up interval to fetch data every 5 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Custom gauge component for accelerometer and gyroscope readings
  const Gauge: React.FC<{ value: number, max: number, title: string, unit: string }> = ({ value, max, title, unit }) => {
    const percentage = Math.min((value / max) * 100, 100);
    
    let color = 'bg-green-500';
    if (percentage > 60) color = 'bg-yellow-500';
    if (percentage > 80) color = 'bg-red-500';
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-sm font-medium">{value.toFixed(2)} {unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Real-time Monitor</h2>
        <div className="text-sm text-gray-500">
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Updating...'}
        </div>
      </div>

      {loading && !data ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tremor status card */}
          <Card className={`p-6 ${data.is_tremor ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2">Tremor Status</h3>
                <div className={`text-2xl font-bold ${data.is_tremor ? 'text-red-600' : 'text-green-600'}`}>
                  {data.is_tremor ? 'Tremor Detected' : 'No Tremor'}
                </div>
                <p className="text-sm mt-2 text-gray-500">
                  Timestamp: {formatTimestamp(data.created_at)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${data.is_tremor ? 'bg-red-100' : 'bg-green-100'}`}>
                {data.is_tremor ? (
                  <Bell className="h-8 w-8 text-red-500" />
                ) : (
                  <CircleArrowDown className="h-8 w-8 text-green-500" />
                )}
              </div>
            </div>
          </Card>

          {/* Motion metrics card */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Movement Metrics</h3>
            <Gauge value={data.accel_rms} max={5} title="Acceleration RMS" unit="g" />
            <Gauge value={data.gyro_rms} max={200} title="Gyroscope RMS" unit="°/s" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Accel Intensity</p>
                <p className="text-lg font-semibold">{data.accel_intensity.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gyro Intensity</p>
                <p className="text-lg font-semibold">{data.gyro_intensity.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          {/* Biometrics card */}
          <Card className="p-6 md:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Biometric Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <ThermometerSun className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Heart Rate</p>
                  <p className="text-2xl font-bold">{data.avg_bpm} <span className="text-sm font-normal">BPM</span></p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <ArrowRight className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">GSR</p>
                  <p className="text-2xl font-bold">{data.gsr} <span className="text-sm font-normal">units</span></p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <ArrowRight className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Base GSR</p>
                  <p className="text-2xl font-bold">{BASE_GSR_LEVEL} <span className="text-sm font-normal">units</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">No data available</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};

export default RealTimeDashboard;
