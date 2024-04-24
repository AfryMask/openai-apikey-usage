

export interface UsageData {
    [model: string]: number | string | number[];
}

export interface Usage {
    [user: string]: UsageData[];
}

interface CSVStruct {
    api_key_name?: string;
    model: string;
    n_context_tokens_total: string;
    n_generated_tokens_total: string;
    timestamp: string;
}

interface JSONStruct {
    api_key_name?: string;
    snapshot_id: string;
    n_context_tokens_total: string;
    n_generated_tokens_total: string;
    aggregation_timestamp: string;
}

export interface ActivityStruct {
    apiKeyName?: string;
    model: string;
    nContextTokensTotal: string;
    nGeneratedTokensTotal: string;
    timestamp: string;
}

function mapJSONToActivity(jsonData: JSONStruct): ActivityStruct {
    return {
        apiKeyName: jsonData.api_key_name,
        model: jsonData.snapshot_id,
        nContextTokensTotal: jsonData.n_context_tokens_total,
        nGeneratedTokensTotal: jsonData.n_generated_tokens_total,
        timestamp: jsonData.aggregation_timestamp
    };
}

function mapCSVToActivity(csvData: CSVStruct): ActivityStruct {
    return {
        apiKeyName: csvData.api_key_name,
        model: csvData.model,
        nContextTokensTotal: csvData.n_context_tokens_total,
        nGeneratedTokensTotal: csvData.n_generated_tokens_total,
        timestamp: csvData.timestamp
    };
}

// Helper function to get the number of days in a month
const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

// Helper function to generate model data structure for UsageData
const generateModelDataForUsage = (models: string[]): UsageData =>
    models.reduce((accum, model) => {
        accum[model] = [0, 0];
        return accum;
    }, { date: '' } as UsageData);

// Function to generate usage structure for UsageData
const generateUsageStructure = (models: string[], numDays: number, year: number, month: number): UsageData[] => {
    const dates: UsageData[] = Array.from({ length: numDays }, (_, dayIndex): UsageData => {
        const dateStr: string = `${year}-${(month + 1).toString().padStart(2, '0')}-${(dayIndex + 1).toString().padStart(2, '0')}`;
        const modelData: UsageData = generateModelDataForUsage(models);
        modelData.date = dateStr;
        return modelData;
    });

    const allDatesElement: UsageData = generateModelDataForUsage(models);
    allDatesElement.date = 'AllDates';
    dates.push(allDatesElement);
    return dates;
};

export const parseActivity = (originData: any, type: string, callback: (usageData: Usage, userNames: string[], models: string[]) => void) => {
    if (!originData.length) {
        console.log('No items found in CSV.');
        return;
    }

    var records: ActivityStruct[]
    if (type === 'csv') {
        records = originData.map(mapCSVToActivity)
    } else if (type === 'json') {
        records = originData.map(mapJSONToActivity)
    } else {
        return;
    }

    const userNames = Array.from(new Set(records.map(record => record.apiKeyName || 'Playground')));
    userNames.push('AllUsers');
    const models = Array.from(new Set(records.flatMap(record => record.model)));
    models.push('AllModels');
    const tokensData: Usage = {};
    const usageData: Usage = {};

    const firstRecordDate = new Date(parseInt(records[0].timestamp) * 1000);
    const year = firstRecordDate.getFullYear();
    const month = firstRecordDate.getMonth();
    const numDays = daysInMonth(year, month);

    userNames.forEach(name => {
        tokensData[name] = generateUsageStructure(models, numDays, year, month);
        usageData[name] = generateUsageStructure(models, numDays, year, month);
    });

    console.log('tokensData:', tokensData);
    records.forEach(record => {
        const dayKey = new Date(parseInt(record.timestamp) * 1000).getDate() - 1;
        const userName = record.apiKeyName || 'Playground';
        const modelKey = record.model;
        const context = parseInt(record.nContextTokensTotal, 10);
        const generated = parseInt(record.nGeneratedTokensTotal, 10);

        [userName, 'AllUsers'].forEach(userKey => {
            (tokensData[userKey][dayKey][modelKey] as number[])[0] += context;
            (tokensData[userKey][dayKey][modelKey] as number[])[1] += generated;

            (tokensData[userKey][numDays][modelKey] as number[])[0] += context;
            (tokensData[userKey][numDays][modelKey] as number[])[1] += generated;

            (tokensData[userKey][dayKey]['AllModels'] as number[])[0] += context;
            (tokensData[userKey][dayKey]['AllModels'] as number[])[1] += generated;

            (tokensData[userKey][numDays]['AllModels'] as number[])[0] += context;
            (tokensData[userKey][numDays]['AllModels'] as number[])[1] += generated;
        });
    });

    // turn AllModels to 0 instead of [0,0]
    userNames.forEach(userKey => {
        tokensData[userKey].forEach((dayData, dayKey) => {
            usageData[userKey][dayKey]['AllModels'] = 0;
        });
    });

    userNames.forEach(userKey => {
        tokensData[userKey].forEach((dayData, dayKey) => {
            for (const [modelName, counts] of Object.entries(dayData)) {
                if (modelName === 'date' || modelName === 'AllModels') {
                    continue;
                }
                const context = (counts as number[])[0] / 1000000;
                const generated = (counts as number[])[1] / 1000000;
                let price = 0;
                if (modelName.includes('gpt-4') && (modelName.includes('vision') || modelName.includes('turbo') || modelName.includes('preview'))) {
                    price = 10 * context + 30 * generated;
                } else if (modelName.includes('gpt-3.5') && (modelName.includes('vision') || modelName.includes('turbo') || modelName.includes('preview'))) {
                    price = 0.5 * context + 1.5 * generated;
                } else if (modelName.includes('gpt-4')) {
                    price = 30 * context + 60 * generated;
                } else if (modelName.includes('gpt-3.5')) {
                    price = 0;
                }
                (usageData[userKey][dayKey][modelName] as number) = price;
                (usageData[userKey][dayKey]['AllModels'] as number) += price;
            }
        });
    });

    callback(usageData, userNames, models);
};