import * as XLSX from 'xlsx';

export interface OtherSystem {
  id: number;
  name: string;
  purpose: string;
  target: string;
  description: string;
  unit: string;
  keywords: string[];
  scenarios: string[];
}

export interface UnitGroup {
  unit: string;
  systems: OtherSystem[];
}

let cachedSystems: OtherSystem[] | null = null;

export async function loadOtherSystems(): Promise<OtherSystem[]> {
  if (cachedSystems) return cachedSystems;

  try {
    const response = await fetch('/data/other_systems.xlsx?v=v1');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    cachedSystems = data.map((row, index) => ({
      id: row['項次'] || index + 1,
      name: row['應用系統名稱'] || '',
      purpose: row['建置目的'] || '',
      target: row['管理標的'] || '',
      description: row['功能描述'] || '',
      unit: (row['提報單位'] || '').replace(/<br\/>/g, '、'),
      keywords: (row['關鍵字_自動產生'] || '').split('；').filter((k: string) => k.trim()),
      scenarios: (row['情境_自動產生'] || '').split(' || ').filter((s: string) => s.trim())
    }));

    return cachedSystems;
  } catch (error) {
    console.error('載入其他系統資料失敗:', error);
    return [];
  }
}

export async function getSystemsByUnit(): Promise<UnitGroup[]> {
  const systems = await loadOtherSystems();
  const unitMap = new Map<string, OtherSystem[]>();

  systems.forEach(system => {
    // Handle multiple units separated by 、
    const units = system.unit.split('、').map(u => u.trim()).filter(u => u);
    units.forEach(unit => {
      if (!unitMap.has(unit)) {
        unitMap.set(unit, []);
      }
      unitMap.get(unit)!.push(system);
    });
  });

  return Array.from(unitMap.entries())
    .map(([unit, systems]) => ({ unit, systems }))
    .sort((a, b) => b.systems.length - a.systems.length);
}

export async function getAllScenarios(): Promise<{ scenario: string; systems: OtherSystem[] }[]> {
  const systems = await loadOtherSystems();
  const scenarioMap = new Map<string, OtherSystem[]>();

  systems.forEach(system => {
    system.scenarios.forEach(scenario => {
      if (!scenarioMap.has(scenario)) {
        scenarioMap.set(scenario, []);
      }
      scenarioMap.get(scenario)!.push(system);
    });
  });

  return Array.from(scenarioMap.entries())
    .map(([scenario, systems]) => ({ scenario, systems }))
    .slice(0, 20); // Limit to 20 scenarios for display
}

export async function searchSystemsByKeyword(keyword: string): Promise<OtherSystem[]> {
  const systems = await loadOtherSystems();
  const lowerKeyword = keyword.toLowerCase();
  
  return systems.filter(system => 
    system.name.toLowerCase().includes(lowerKeyword) ||
    system.purpose.toLowerCase().includes(lowerKeyword) ||
    system.target.toLowerCase().includes(lowerKeyword) ||
    system.description.toLowerCase().includes(lowerKeyword) ||
    system.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
  );
}
