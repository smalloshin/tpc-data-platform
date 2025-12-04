import * as XLSX from 'xlsx';

export interface SystemData {
  index: number;
  systemName: string;
  purpose: string;
  managementTarget: string;
  functionDescription: string;
  responsibleUnit: string;
  keywords: string;
  scenarios: string;
  themeL1: string;
  analysisTaskL2: string;
  exampleScenarioL3: string;
}

let cachedData: SystemData[] | null = null;
const DATA_VERSION = 'v1';

export const loadOtherSystems = async (): Promise<SystemData[]> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(`/data/other_systems.xlsx?v=${DATA_VERSION}`);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
    
    const systems: SystemData[] = jsonData.map((row: any) => ({
      index: row['項次'] || 0,
      systemName: row['應用系統名稱'] || '',
      purpose: row['建置目的'] || '',
      managementTarget: row['管理標的'] || '',
      functionDescription: row['功能描述'] || '',
      responsibleUnit: (row['提報單位'] || '').replace(/<br\s*\/?>/gi, '、'),
      keywords: row['關鍵字_自動產生'] || '',
      scenarios: row['情境_自動產生'] || '',
      themeL1: row['情境_L1_主題領域'] || '',
      analysisTaskL2: row['情境_L2_分析任務'] || '',
      exampleScenarioL3: row['情境_L3_範例情境'] || ''
    }));
    
    cachedData = systems;
    return systems;
  } catch (error) {
    console.error('載入其他系統資料失敗:', error);
    return [];
  }
};

export const getSystemsByUnit = async (): Promise<Map<string, SystemData[]>> => {
  const systems = await loadOtherSystems();
  const unitMap = new Map<string, SystemData[]>();
  
  systems.forEach(system => {
    const units = system.responsibleUnit.split(/[、,]/);
    units.forEach(unit => {
      const cleanUnit = unit.trim();
      if (cleanUnit) {
        if (!unitMap.has(cleanUnit)) {
          unitMap.set(cleanUnit, []);
        }
        unitMap.get(cleanUnit)!.push(system);
      }
    });
  });
  
  return unitMap;
};

export interface ScenarioHierarchy {
  l1Theme: string;
  l2Tasks: Map<string, SystemData[]>;
}

export const getSystemsByScenario = async (): Promise<Map<string, ScenarioHierarchy>> => {
  const systems = await loadOtherSystems();
  const scenarioMap = new Map<string, ScenarioHierarchy>();
  
  systems.forEach(system => {
    const l1 = system.themeL1;
    const l2 = system.analysisTaskL2;
    
    if (!l1) return;
    
    if (!scenarioMap.has(l1)) {
      scenarioMap.set(l1, {
        l1Theme: l1,
        l2Tasks: new Map()
      });
    }
    
    const hierarchy = scenarioMap.get(l1)!;
    if (l2) {
      if (!hierarchy.l2Tasks.has(l2)) {
        hierarchy.l2Tasks.set(l2, []);
      }
      hierarchy.l2Tasks.get(l2)!.push(system);
    }
  });
  
  return scenarioMap;
};

export const searchOtherSystems = (systems: SystemData[], keyword: string): SystemData[] => {
  if (!keyword.trim()) return systems;
  
  const searchTerm = keyword.toLowerCase();
  return systems.filter(system => 
    system.systemName.toLowerCase().includes(searchTerm) ||
    system.purpose.toLowerCase().includes(searchTerm) ||
    system.managementTarget.toLowerCase().includes(searchTerm) ||
    system.functionDescription.toLowerCase().includes(searchTerm) ||
    system.keywords.toLowerCase().includes(searchTerm) ||
    system.themeL1.toLowerCase().includes(searchTerm) ||
    system.analysisTaskL2.toLowerCase().includes(searchTerm) ||
    system.scenarios.toLowerCase().includes(searchTerm)
  );
};
