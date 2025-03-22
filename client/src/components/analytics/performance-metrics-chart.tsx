import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data - in a real application, this would come from API calls
const generatePerformanceData = (numPoints = 10, detailed = false) => {
  const categories = detailed
    ? ['Technical Knowledge', 'Aircraft Handling', 'Procedures', 'CRM', 'Decision Making', 'Situational Awareness', 'Workload Management']
    : ['Technical Knowledge', 'Aircraft Handling', 'Procedures', 'CRM'];
  
  return Array.from({ length: numPoints }).map((_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (numPoints - i - 1));
    
    const entry: Record<string, any> = {
      name: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    };
    
    // Generate realistic data for each category with upward trend and minor variations
    categories.forEach(category => {
      // Base value between 2.0 and 3.0 with upward progression
      const baseValue = 2.0 + (i * 0.1);
      // Random variation +/- 0.3
      const variation = (Math.random() * 0.6) - 0.3;
      // Ensure final value is between 1 and 4
      let value = Math.min(Math.max(baseValue + variation, 1), 4);
      // Round to one decimal place
      value = Math.round(value * 10) / 10;
      
      entry[category] = value;
    });
    
    return entry;
  });
};

// Define colors for different metrics
const categoryColors = {
  'Technical Knowledge': '#8884d8',
  'Aircraft Handling': '#82ca9d',
  'Procedures': '#ffc658',
  'CRM': '#ff8042',
  'Decision Making': '#a4de6c',
  'Situational Awareness': '#d0ed57',
  'Workload Management': '#83a6ed'
};

interface PerformanceMetricsChartProps {
  showDetailed?: boolean;
}

export default function PerformanceMetricsChart({ showDetailed = false }: PerformanceMetricsChartProps) {
  const [timeframe, setTimeframe] = useState('6m');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    showDetailed
      ? ['Technical Knowledge', 'Aircraft Handling', 'Procedures', 'CRM']
      : ['Technical Knowledge', 'Aircraft Handling', 'Procedures', 'CRM']
  );

  // Generate data based on the selected timeframe
  let dataPoints;
  switch (timeframe) {
    case '1m':
      dataPoints = 4; // Weekly data points for 1 month
      break;
    case '3m':
      dataPoints = 6; // Bi-weekly data points for 3 months
      break;
    case '6m':
      dataPoints = 6; // Monthly data points for 6 months
      break;
    case '1y':
      dataPoints = 12; // Monthly data points for 1 year
      break;
    default:
      dataPoints = 6;
  }

  const data = generatePerformanceData(dataPoints, showDetailed);

  // All possible categories
  const allCategories = showDetailed
    ? ['Technical Knowledge', 'Aircraft Handling', 'Procedures', 'CRM', 'Decision Making', 'Situational Awareness', 'Workload Management']
    : ['Technical Knowledge', 'Aircraft Handling', 'Procedures', 'CRM'];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {allCategories.map(category => (
            <Button
              key={category}
              variant={selectedCategories.includes(category) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategory(category)}
              className="text-xs"
              style={{ 
                backgroundColor: selectedCategories.includes(category) 
                  ? categoryColors[category as keyof typeof categoryColors] 
                  : 'transparent',
                color: selectedCategories.includes(category) ? 'white' : 'inherit',
                borderColor: categoryColors[category as keyof typeof categoryColors]
              }}
            >
              {category}
            </Button>
          ))}
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
            <Tooltip 
              formatter={(value: any) => [`${value} (1-4)`, '']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            {selectedCategories.map(category => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={categoryColors[category as keyof typeof categoryColors]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}