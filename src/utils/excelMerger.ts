import * as XLSX from 'xlsx';

export interface MergedDatasetRow {
  部門: string;
  資料集ID: string;
  資料集名稱: string;
  資料集詳細說明: string;
  範例資料: string;
  資料集總結: string;
}

export const mergeAndDownloadExcel = async (): Promise<void> => {
  try {
    // 載入原始資料集詳細資訊
    const detailsResponse = await fetch('/data/dataset_details.xlsx');
    const detailsBuffer = await detailsResponse.arrayBuffer();
    const detailsWorkbook = XLSX.read(detailsBuffer, { type: 'array' });
    const detailsSheet = detailsWorkbook.Sheets[detailsWorkbook.SheetNames[0]];
    const detailsData = XLSX.utils.sheet_to_json<any>(detailsSheet);

    // 載入資料集總結
    const summaryResponse = await fetch('/data/dataset_summary.xlsx');
    const summaryBuffer = await summaryResponse.arrayBuffer();
    const summaryWorkbook = XLSX.read(summaryBuffer, { type: 'array' });
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

    // 合併資料
    const mergedData: MergedDatasetRow[] = detailsData.map((row: any) => {
      const name = row['資料集名稱'] || '';
      return {
        部門: row['部門'] || '',
        資料集ID: String(row['資料集ID'] || ''),
        資料集名稱: name,
        資料集詳細說明: row['資料集詳細說明'] || '',
        範例資料: row['範例資料'] || '',
        資料集總結: summaryMap.get(name) || ''
      };
    });

    // 建立新的工作簿
    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(mergedData);
    
    // 設定欄寬
    newSheet['!cols'] = [
      { wch: 15 },  // 部門
      { wch: 12 },  // 資料集ID
      { wch: 40 },  // 資料集名稱
      { wch: 60 },  // 資料集詳細說明
      { wch: 50 },  // 範例資料
      { wch: 80 },  // 資料集總結
    ];

    XLSX.utils.book_append_sheet(newWorkbook, newSheet, '合併資料集');

    // 下載檔案
    XLSX.writeFile(newWorkbook, 'dataset_details_merged.xlsx');
  } catch (error) {
    console.error('合併 Excel 失敗:', error);
    throw error;
  }
};
