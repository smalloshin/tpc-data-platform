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

// 解析完整的 CSV，正確處理多行引號欄位
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // 雙引號轉義
          currentField += '"';
          i++;
        } else {
          // 結束引號
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++; // 跳過 \r\n 中的 \n
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  
  // 處理最後一個欄位和行
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim())) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

export const loadBigDataDatasets = async (): Promise<Map<string, BigDataDataset>> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    // 使用英文檔名避免中文路徑在某些環境下的 404 問題
    const url = `/data/big_data_datasets.csv?v=${DATA_VERSION}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching ${url}`);
    }

    const text = await response.text();
    
    const dataMap = new Map<string, BigDataDataset>();
    
    // 解析 CSV（處理多行欄位）
    const rows = parseCSV(text);
    
    // 跳過標題行
    for (let i = 1; i < rows.length; i++) {
      const fields = rows[i];
      
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

export const getBigDataDataset = async (datasetName: string): Promise<BigDataDataset | null> => {
  const dataMap = await loadBigDataDatasets();
  return dataMap.get(datasetName) || null;
};
