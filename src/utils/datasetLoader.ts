import * as XLSX from 'xlsx';

export interface DatasetDetail {
  department: string;
  id: string;
  name: string;
  description: string;
  sampleData: string;
  summary: string;
}

let cachedData: Map<string, DatasetDetail> | null = null;

// 版本號用於強制重新載入資料
const DATA_VERSION = 'v4';

export const loadDatasetDetails = async (): Promise<Map<string, DatasetDetail>> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    // 載入原始資料集詳細資訊
    const response = await fetch(`/data/dataset_details.xlsx?v=${DATA_VERSION}`);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
    
    // 載入資料集總結
    const summaryResponse = await fetch(`/data/dataset_summary.xlsx?v=${DATA_VERSION}`);
    const summaryArrayBuffer = await summaryResponse.arrayBuffer();
    const summaryWorkbook = XLSX.read(summaryArrayBuffer, { type: 'array' });
    
    const summarySheet = summaryWorkbook.Sheets[summaryWorkbook.SheetNames[0]];
    const summaryData = XLSX.utils.sheet_to_json<any>(summarySheet);
    
    // 建立資料集名稱到總結的映射
    const summaryMap = new Map<string, string>();
    summaryData.forEach((row: any) => {
      const name = row['資料集名稱'] || '';
      const summary = row['資料集總結'] || '';
      if (name && summary) {
        summaryMap.set(name, summary);
      }
    });
    
    const dataMap = new Map<string, DatasetDetail>();
    
    jsonData.forEach((row: any) => {
      const name = row['資料集名稱'] || '';
      const sampleDataRaw = row['範例資料'];
      
      // 處理範例資料 - 可能是字串或其他格式
      let sampleData = '';
      if (sampleDataRaw) {
        if (typeof sampleDataRaw === 'string') {
          sampleData = sampleDataRaw;
        } else if (typeof sampleDataRaw === 'object') {
          sampleData = JSON.stringify(sampleDataRaw);
        } else {
          sampleData = String(sampleDataRaw);
        }
      }
      
      const detail: DatasetDetail = {
        department: row['部門'] || '',
        id: String(row['資料集ID'] || ''),
        name: name,
        description: row['資料集詳細說明'] || '',
        sampleData: sampleData,
        summary: summaryMap.get(name) || ''
      };
      
      if (detail.name) {
        dataMap.set(detail.name, detail);
      }
    });
    
    cachedData = dataMap;
    return dataMap;
  } catch (error) {
    console.error('載入資料集詳細資訊失敗:', error);
    return new Map();
  }
};

export const getDatasetDetail = async (datasetName: string): Promise<DatasetDetail | null> => {
  const dataMap = await loadDatasetDetails();
  return dataMap.get(datasetName) || null;
};
