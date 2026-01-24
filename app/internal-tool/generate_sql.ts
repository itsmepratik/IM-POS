
import { carData, oilFilters } from "./data";

const statements: string[] = [];

// @ts-ignore
for (const make in carData) {
    // @ts-ignore
  const makeData = carData[make];
  for (const model in makeData) {
      // @ts-ignore
    const modelData = makeData[model];
    for (const year in modelData) {
        // @ts-ignore
      const yearData = modelData[year];
      for (const engine in yearData) {
          // @ts-ignore
        const volume = yearData[engine];
        
        let filter = null;
        try {
            // @ts-ignore
            filter = oilFilters[make][model][year][engine];
        } catch (e) {}

        statements.push(`INSERT INTO vehicles (make, model, year, engine, oil_capacity, oil_filter_part_number) VALUES ('${make}', '${model}', ${year}, '${engine}', ${volume}, ${filter ? `'${filter}'` : 'NULL'});`);
      }
    }
  }
}
