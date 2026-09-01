export type LaboratoryResultFieldKind = "boolean" | "number" | "text"

export interface LaboratoryResultField {
  key: string
  label: string
  kind: LaboratoryResultFieldKind
}

const templates: Record<string, readonly LaboratoryResultField[]> = {
  Ecografia: [
    { key: "organo", label: "Órgano o zona examinada", kind: "text" },
    { key: "hallazgos", label: "Hallazgos", kind: "text" },
    { key: "conclusion", label: "Conclusión", kind: "text" },
  ],
  Hemograma: [
    { key: "hemoglobina", label: "Hemoglobina", kind: "number" },
    { key: "hematocrito", label: "Hematocrito", kind: "number" },
    { key: "leucocitos", label: "Leucocitos", kind: "number" },
    { key: "plaquetas", label: "Plaquetas", kind: "number" },
  ],
  Orina: [
    { key: "ph", label: "pH", kind: "number" },
    { key: "densidad", label: "Densidad", kind: "number" },
    { key: "glucosa", label: "Glucosa", kind: "text" },
    { key: "proteinas", label: "Proteínas", kind: "text" },
  ],
  Radiografia: [
    { key: "region", label: "Región examinada", kind: "text" },
    { key: "hallazgos", label: "Hallazgos", kind: "text" },
    { key: "impresion", label: "Impresión", kind: "text" },
  ],
  Resonancia: [
    { key: "region", label: "Región examinada", kind: "text" },
    { key: "secuencias", label: "Secuencias", kind: "text" },
    { key: "hallazgos", label: "Hallazgos", kind: "text" },
    { key: "impresion", label: "Impresión", kind: "text" },
  ],
  Tac: [
    { key: "region", label: "Región examinada", kind: "text" },
    { key: "conContraste", label: "Con contraste", kind: "boolean" },
    { key: "hallazgos", label: "Hallazgos", kind: "text" },
  ],
}

export function getLaboratoryResultTemplate(testType: string) {
  return templates[testType] ?? []
}
