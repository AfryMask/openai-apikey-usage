import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { parseActivity } from './tools/parseActivity';
import CustomBarChart from "./chart/CustomBarChart"

interface DateData {
  [key: string]: any;
}

interface UserData {
  [user: string]: DateData[];
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const App: React.FC = () => {
  const [usageData, setUsageData] = useState<UserData>({});
  const [userNames, setUserNames] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    function handleMessage(event: any) {
      const trustedOrigins = ['https://platform.openai.com'];
      if (!trustedOrigins.includes(event.origin)) {
        return;
      }
      console.log('Received message:', event.data);
      parseActivity(event.data.data.data, 'json', (usageData, userNames, models) => {
        console.log('final results:', usageData);
        setUsageData(usageData);
        setUserNames(userNames);
        setModels(models);
      });
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      Papa.parse(file, {
        header: true,
        complete: (results: any) => {
          parseActivity(results.data, 'csv', (usageData, userNames, models) => {
            console.log('final results:', usageData);
            setUsageData(usageData);
            setUserNames(userNames);
            setModels(models);
          });
        },
        skipEmptyLines: true
      });
    }
  };

  return (
    <div>
      <h1>OpenAI APIKey usage</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />

      {userNames.map((key, index) => (
        <div key={index}>
          <div>{key}: {usageData[key][usageData[key].length - 1]['AllModels']}</div>
          <CustomBarChart
            data={usageData[key]}
            dataKeys={models.filter(m => m !== 'AllModels')}
            fills={models.map(() => getRandomColor())}
          />
        </div>
      ))}

    </div>

  );
};

export default App;
