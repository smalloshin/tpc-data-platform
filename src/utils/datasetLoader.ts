export interface DatasetDetail {
  name: string;
  description: string;
  coreFunction: string;
  geoScope: string;
  timeRange: string;
  dataGranularity: string;
  scenario1: string;
  scenario2: string;
  scenario3: string;
  updateDelay: string;
  completeness: string;
  accuracy: string;
  relatedDatasets: string;
  usageSuggestion: string;
}

let cachedData: Map<string, DatasetDetail> | null = null;

const parseCSV = (text: string): any[] => {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const result: any[] = [];
  
  let currentRow = '';
  for (let i = 1; i < lines.length; i++) {
    currentRow += (currentRow ? '\n' : '') + lines[i];
    const quoteCount = (currentRow.match(/"/g) || []).length;
    
    if (quoteCount % 2 === 0) {
      const values = parseCSVLine(currentRow);
      if (values.length === headers.length) {
        const obj: any = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx];
        });
        result.push(obj);
      }
      currentRow = '';
    }
  }
  
  return result;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
};

export const loadDatasetDetails = async (): Promise<Map<string, DatasetDetail>> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch('/data/dataset_summary.csv');
    const text = await response.text();
    const jsonData = parseCSV(text);
    
    const dataMap = new Map<string, DatasetDetail>();
    
    jsonData.forEach((row: any) => {
      const name = row['資料集名稱'] || '';
      if (name) {
        const detail: DatasetDetail = {
          name: name,
          description: row['資料集總結'] || '',
          coreFunction: row['核心功能'] || '',
          geoScope: row['地理範圍'] || '',
          timeRange: row['時間範圍'] || '',
          dataGranularity: row['資料粒度'] || '',
          scenario1: row['應用場景 1'] || '',
          scenario2: row['應用場景 2'] || '',
          scenario3: row['應用場景 3'] || '',
          updateDelay: row['更新延遲'] || '',
          completeness: row['完整性'] || '',
          accuracy: row['準確性'] || '',
          relatedDatasets: row['相關資料集'] || '',
          usageSuggestion: row['使用建議'] || ''
        };
        dataMap.set(name, detail);
      }
    });
    
    cachedData = dataMap;
    console.log(`成功載入 ${dataMap.size} 個資料集的總結資訊`);
    return dataMap;
  } catch (error) {
    console.error('載入資料集總結資訊失敗:', error);
    return new Map();
  }
};

export const getDatasetDetail = async (datasetName: string): Promise<DatasetDetail | null> => {
  const dataMap = await loadDatasetDetails();
  return dataMap.get(datasetName) || null;
};
