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
  ReferenceLine,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Generate skill decay prediction data for a future time period
const generateSkillDecayData = (skill: string) => {
  // Initial competency values (different for each skill)
  const initialValues = {
    'Aircraft Systems': 3.8,
    'Emergency Procedures': 3.5,
    'Instrument Flying': 3.7,
    'Radio Navigation': 3.4,
    'Abnormal Procedures': 3.6
  };

  // Decay rates (different for each skill)
  const decayRates = {
    'Aircraft Systems': 0.08,
    'Emergency Procedures': 0.12,
    'Instrument Flying': 0.07,
    'Radio Navigation': 0.05,
    'Abnormal Procedures': 0.10
  };

  // Starting value depends on the skill
  const initialValue = initialValues[skill as keyof typeof initialValues] || 3.5;
  const decayRate = decayRates[skill as keyof typeof decayRates] || 0.08;

  // Generate 12 months of decay prediction
  return Array.from({ length: 13 }).map((_, i) => {
    // Apply exponential decay formula: initialValue * e^(-decayRate * time)
    // Ensure the value doesn't go below a minimum threshold (1.0 in this case)
    const predictedValue = Math.max(
      initialValue * Math.exp(-decayRate * i), 
      1.0
    ).toFixed(1);

    // Current month + i months
    const date = new Date();
    date.setMonth(date.getMonth() + i);

    return {
      month: i === 0 ? 'Now' : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      predicted: parseFloat(predictedValue),
      minimumRequired: 2.0, // Minimum acceptable performance level
    };
  });
};

export default function SkillDecayPrediction() {
  const [selectedSkill, setSelectedSkill] = useState('Emergency Procedures');
  const [activeTab, setActiveTab] = useState('chart');
  
  const data = generateSkillDecayData(selectedSkill);
  
  // Find the month where skill drops below minimum
  const refreshPoint = data.findIndex(d => d.predicted < d.minimumRequired);
  const refreshMonth = refreshPoint > 0 ? data[refreshPoint].month : 'Beyond 12 months';
  
  // Calculate a recommendation
  const recommendedRefresh = Math.max(1, refreshPoint - 2); // 2 months before it reaches minimum
  const recommendedMonth = recommendedRefresh > 0 && recommendedRefresh < data.length 
    ? data[recommendedRefresh].month 
    : 'Next month';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select competency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Aircraft Systems">Aircraft Systems</SelectItem>
            <SelectItem value="Emergency Procedures">Emergency Procedures</SelectItem>
            <SelectItem value="Instrument Flying">Instrument Flying</SelectItem>
            <SelectItem value="Radio Navigation">Radio Navigation</SelectItem>
            <SelectItem value="Abnormal Procedures">Abnormal Procedures</SelectItem>
          </SelectContent>
        </Select>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="chart" className="h-[300px] mt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'predicted') return [`${value} (1-4)`, 'Predicted Skill Level'];
                return [`${value} (1-4)`, 'Minimum Required Level'];
              }}
            />
            <Legend />
            <ReferenceLine 
              y={data[0].predicted} 
              stroke="green" 
              strokeDasharray="3 3" 
              label={{ value: 'Current Level', position: 'insideTopLeft' }} 
            />
            <ReferenceLine 
              y={2.0} 
              stroke="red" 
              strokeDasharray="3 3" 
              label={{ value: 'Minimum Required', position: 'insideBottomLeft' }} 
            />
            {refreshPoint > 0 && (
              <ReferenceLine 
                x={data[refreshPoint].month} 
                stroke="red" 
                label={{ value: 'Refresh Point', angle: 90, position: 'insideTopRight' }} 
              />
            )}
            {recommendedRefresh > 0 && recommendedRefresh < data.length && (
              <ReferenceLine 
                x={data[recommendedRefresh].month} 
                stroke="blue" 
                strokeDasharray="3 3" 
                label={{ value: 'Recommended', angle: 90, position: 'insideBottomRight' }} 
              />
            )}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="minimumRequired"
              stroke="#ff7300"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>
      
      <TabsContent value="data" className="mt-0">
        <div className="space-y-4 p-4 border rounded-md">
          <div>
            <h3 className="font-medium text-lg">{selectedSkill} Decay Analysis</h3>
            <p className="text-muted-foreground">Bayesian Knowledge Tracing prediction</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Current skill level:</span>
              <span className="font-medium">{data[0].predicted} / 4.0</span>
            </div>
            <div className="flex justify-between">
              <span>Predicted skill drops below minimum:</span>
              <span className="font-medium">{refreshPoint > 0 ? `In ${refreshPoint} months (${refreshMonth})` : 'Beyond one year'}</span>
            </div>
            <div className="flex justify-between">
              <span>Recommended refresher training:</span>
              <span className="font-medium text-blue-600">{recommendedMonth}</span>
            </div>
            <div className="flex justify-between">
              <span>Decay rate (per month):</span>
              <span className="font-medium">{
                ((parseFloat(data[0].predicted.toString()) - parseFloat(data[1].predicted.toString())) / 
                parseFloat(data[0].predicted.toString()) * 100).toFixed(1)
              }%</span>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        <p><strong>AI Recommendation:</strong> Schedule a {selectedSkill} refresher training by {recommendedMonth} to maintain proficiency above required levels.</p>
      </div>
    </div>
  );
}