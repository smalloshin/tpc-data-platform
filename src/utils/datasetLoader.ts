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

export const loadDatasetDetails = async (): Promise<Map<string, DatasetDetail>> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch('/data/dataset_details.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
    
    const dataMap = new Map<string, DatasetDetail>();
    
    jsonData.forEach((row: any) => {
      const detail: DatasetDetail = {
        department: row['提供單位'] || row['部門'] || '',
        id: String(row['資料集ID'] || ''),
        name: row['資料集名稱'] || '',
        description: row['資料集描述'] || row['資料集詳細說明'] || '',
        sampleData: row['範例資料'] || '',
        summary: row['資料集總結'] || ''
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
