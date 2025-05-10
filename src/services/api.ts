
import { supabase } from '@/lib/supabase';

// Define the Tremor data interface
export interface TremorData {
  id: number;
  timestamp: number;
  gsr: number;
  accel_rms: number;
  gyro_rms: number;
  is_tremor: boolean;
  accel_intensity: number;
  gyro_intensity: number;
  avg_bpm: number;
  created_at: string;
}

// Get the latest tremor data record
export const getLatestData = async (): Promise<TremorData | null> => {
  try {
    console.log('Fetching latest tremor data...');
    
    const { data, error } = await supabase
      .from('tremor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching latest tremor data:', error);
      throw new Error(`Failed to fetch latest data: ${error.message}`);
    }
    
    console.log('Latest tremor data:', data);
    return data;
  } catch (error) {
    console.error('Error in getLatestData:', error);
    throw error;
  }
};

// Get historical tremor data (last 100 records)
export const getHistoricalData = async (): Promise<TremorData[]> => {
  try {
    console.log('Fetching historical tremor data...');
    
    const { data, error } = await supabase
      .from('tremor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching historical tremor data:', error);
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
    
    console.log(`Fetched ${data?.length || 0} historical records`);
    return data || [];
  } catch (error) {
    console.error('Error in getHistoricalData:', error);
    throw error;
  }
};
