import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Generate comparison data for trainees
const generateTraineeComparisonData = (competency: string) => {
  // List of trainees
  const trainees = [
    "Johnson, T.", "Smith, A.", "Williams, R.", "Brown, J.", 
    "Garcia, M.", "Davis, S.", "Rodriguez, J.", "Miller, P."
  ];
  
  // Base values for different competencies
  const baseValues = {
    'Overall': 2.8,
    'Technical Knowledge': 3.0,
    'Aircraft Handling': 2.7,
    'Procedures': 2.9,
    'CRM': 3.1,
    'Decision Making': 2.6
  };
  
  // Use the base value for the selected competency
  const baseValue = baseValues[competency as keyof typeof baseValues] || 2.8;
  
  // Generate realistic performance data for each trainee
  return trainees.map(trainee => {
    // Random variation +/- 0.7
    const variation = (Math.random() * 1.4) - 0.7;
    // Ensure value is between 1 and 4
    let value = Math.min(Math.max(baseValue + variation, 1), 4);
    // Round to one decimal place
    value = Math.round(value * 10) / 10;
    
    return {
      name: trainee,
      value: value,
      avgValue: baseValue // Class average
    };
  }).sort((a, b) => b.value - a.value); // Sort by performance, highest first
};

export default function TraineeComparisonChart() {
  const [selectedCompetency, setSelectedCompetency] = useState<string>('Overall');
  const data = generateTraineeComparisonData(selectedCompetency);
  
  // Calculate fleet average
  const fleetAverage = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          Trainee Performance Comparison - {selectedCompetency}
        </h3>
        <Select 
          value={selectedCompetency} 
          onValueChange={setSelectedCompetency}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select competency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Overall">Overall Performance</SelectItem>
            <SelectItem value="Technical Knowledge">Technical Knowledge</SelectItem>
            <SelectItem value="Aircraft Handling">Aircraft Handling</SelectItem>
            <SelectItem value="Procedures">Procedures</SelectItem>
            <SelectItem value="CRM">CRM</SelectItem>
            <SelectItem value="Decision Making">Decision Making</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal />
            <XAxis 
              type="number" 
              domain={[0, 4]} 
              ticks={[0, 1, 2, 3, 4]} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              scale="point" 
              interval={0} 
            />
            <Tooltip 
              formatter={(value: any) => [`${value} (1-4)`, '']}
              labelFormatter={(label) => `Trainee: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Performance Score" 
              fill="#8884d8" 
              radius={[0, 4, 4, 0]} 
              barSize={20}
            />
            <ReferenceLine 
              x={fleetAverage} 
              stroke="red" 
              strokeDasharray="3 3" 
              label={{ 
                value: `Fleet Avg: ${fleetAverage.toFixed(1)}`, 
                position: 'top',
                fill: 'red',
                fontSize: 12
              }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between text-sm px-2">
        <div>
          <span className="text-muted-foreground">Top performer: </span>
          <span className="font-medium">{data[0]?.name || 'N/A'}</span>
          <span className="ml-1 text-emerald-600 font-medium">({data[0]?.value || 'N/A'})</span>
        </div>
        <div>
          <span className="text-muted-foreground">Needs improvement: </span>
          <span className="font-medium">{data[data.length - 1]?.name || 'N/A'}</span>
          <span className="ml-1 text-amber-600 font-medium">({data[data.length - 1]?.value || 'N/A'})</span>
        </div>
      </div>
    </div>
  );
}