import * as XLSX from 'xlsx';

export interface DatasetDetail {
  name: string;
  description: string;
  sampleData: string;
  summary: string;
}

let cachedData: Map<string, DatasetDetail> | null = null;

const parseCSV = (text: string): any[] => {
  // 移除 BOM 字元
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText.split('\n');
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

  const dataMap = new Map<string, DatasetDetail>();

  try {
    // 載入原有的 xlsx 檔案（詳情和範例資料）
    const xlsxResponse = await fetch('/data/dataset_details.xlsx');
    const arrayBuffer = await xlsxResponse.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const xlsxData = XLSX.utils.sheet_to_json<any>(firstSheet);
    
    xlsxData.forEach((row: any) => {
      const name = row['資料集名稱'] || '';
      if (name) {
        dataMap.set(name, {
          name: name,
          description: row['資料集詳細說明'] || '',
          sampleData: row['範例資料'] || '',
          summary: ''
        });
      }
    });
    console.log(`成功從 xlsx 載入 ${dataMap.size} 個資料集`);
  } catch (error) {
    console.error('載入 dataset_details.xlsx 失敗:', error);
  }

  try {
    // 載入 CSV 檔案（資料集總結）
    const csvResponse = await fetch('/data/dataset_summary.csv');
    const text = await csvResponse.text();
    const csvData = parseCSV(text);
    
    let summaryCount = 0;
    csvData.forEach((row: any) => {
      const name = row['資料集名稱'] || '';
      const summary = row['資料集總結'] || '';
      if (name && summary) {
        const existing = dataMap.get(name);
        if (existing) {
          existing.summary = summary;
        } else {
          dataMap.set(name, {
            name: name,
            description: '',
            sampleData: '',
            summary: summary
          });
        }
        summaryCount++;
      }
    });
    console.log(`成功從 csv 載入 ${summaryCount} 個資料集總結`);
  } catch (error) {
    console.error('載入 dataset_summary.csv 失敗:', error);
  }

  cachedData = dataMap;
  return dataMap;
};

export const getDatasetDetail = async (datasetName: string): Promise<DatasetDetail | null> => {
  const dataMap = await loadDatasetDetails();
  return dataMap.get(datasetName) || null;
};
