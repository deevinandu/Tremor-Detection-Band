
import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard';
import HistoricalDashboard from '@/components/dashboard/HistoricalDashboard';
import Header from '@/components/dashboard/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">Tremor Detection Dashboard</h1>
        
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 mx-auto max-w-md">
            <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
            <TabsTrigger value="historical">Historical Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="realtime">
            <div className="grid gap-6">
              <Card className="p-4 md:p-6 shadow-lg">
                <RealTimeDashboard />
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="historical">
            <div className="grid gap-6">
              <Card className="p-4 md:p-6 shadow-lg overflow-x-hidden">
                <HistoricalDashboard />
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
