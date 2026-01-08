export interface BigDataDataset {
  name: string;
  category: string;
  tags: string[];
  rewrittenDescription: string;
}

let cachedData: Map<string, BigDataDataset> | null = null;

const DATA_VERSION = 'v1';

export const clearBigDataCache = () => {
  cachedData = null;
};

export const loadBigDataDatasets = async (): Promise<Map<string, BigDataDataset>> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(`/data/電業資料集_分類結果.csv?v=${DATA_VERSION}`);
    const text = await response.text();
    
    const dataMap = new Map<string, BigDataDataset>();
    
    // 解析 CSV
    const lines = text.split('\n');
    
    // 跳過標題行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // CSV 解析 - 處理包含逗號和引號的欄位
      const fields = parseCSVLine(line);
      
      if (fields.length >= 4) {
        const name = fields[0].trim();
        const category = fields[1].trim();
        const tagsStr = fields[2].trim();
        const rewrittenDescription = fields[3].trim();
        
        // 解析標籤（以逗號分隔）
        const tags = tagsStr
          .split(',')
          .map(t => t.trim())
          .filter(t => t);
        
        if (name) {
          dataMap.set(name, {
            name,
            category,
            tags,
            rewrittenDescription
          });
        }
      }
    }
    
    cachedData = dataMap;
    console.log(`已載入 ${dataMap.size} 筆大數據平台資料集`);
    return dataMap;
  } catch (error) {
    console.error('載入大數據平台資料集失敗:', error);
    return new Map();
  }
};

// 解析 CSV 行，正確處理引號內的逗號
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // 處理雙引號
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  return fields;
}

export const getBigDataDataset = async (datasetName: string): Promise<BigDataDataset | null> => {
  const dataMap = await loadBigDataDatasets();
  return dataMap.get(datasetName) || null;
};
