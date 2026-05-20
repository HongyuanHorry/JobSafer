import rawCsv from '../datasets/iteration2_dataset.csv?raw'

export const SCAM_TYPE_DISPLAY_CONFIG = [
  { key: 'financial fraud', label: 'Financial Fraud' },
  { key: 'identity theft', label: 'Identity Theft' },
  { key: 'investment', label: 'Investment' },
  { key: 'phishing', label: 'Phishing' },
  { key: 'task-based scam', label: 'Task-based Scam' },
]

const SCAM_TYPE_DISPLAY_MAP = new Map(
  SCAM_TYPE_DISPLAY_CONFIG.map((entry) => [entry.key.toLowerCase(), entry.label]),
)

function parseCsv(raw) {
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/)
  const headers = headerLine.split(',').map((item) => item.trim())

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split(',').map((item) => item.trim())
      return Object.fromEntries(headers.map((header, index) => [header, values[index]]))
    })
    .map((row) => ({
      year: Number(row.year),
      month: Number(row.month),
      scam_type: row.scam_type,
      age_group: row.age_group,
      location: row.location,
      report_count: Number(row.report_count || 0),
      total_loss: Number(row.total_loss || 0),
      date: row.date,
    }))
}

const dataset = parseCsv(rawCsv)

export function getScamTypeLabel(scamType) {
  const normalized = String(scamType || '').trim().toLowerCase()
  if (!normalized) return ''

  if (SCAM_TYPE_DISPLAY_MAP.has(normalized)) {
    return SCAM_TYPE_DISPLAY_MAP.get(normalized)
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getScamTypeOptions() {
  const availableTypes = new Set(
    dataset
      .map((row) => String(row.scam_type || '').trim().toLowerCase())
      .filter(Boolean),
  )

  const ordered = SCAM_TYPE_DISPLAY_CONFIG.filter((entry) => availableTypes.has(entry.key)).map(
    (entry) => ({
      value: entry.key,
      label: entry.label,
    }),
  )

  const leftovers = [...availableTypes]
    .filter((value) => !SCAM_TYPE_DISPLAY_MAP.has(value))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: getScamTypeLabel(value) }))

  return [...ordered, ...leftovers]
}

export function getScamTypes() {
  return getScamTypeOptions().map((option) => option.value)
}

export function getTimePeriod(records = dataset) {
  const years = records.map((row) => row.year).filter(Number.isFinite)

  if (!years.length) return 'No available years'

  return `${Math.min(...years)}–${Math.max(...years)}`
}

export function getTrendByScamType(scamType) {
  const records = dataset.filter((row) => row.scam_type === scamType)

  if (!records.length) return []

  const grouped = new Map()

  records.forEach((row) => {
    if (!grouped.has(row.year)) {
      grouped.set(row.year, {
        year: row.year,
        report_count: 0,
        total_loss: 0,
      })
    }

    const item = grouped.get(row.year)
    item.report_count += row.report_count
    item.total_loss += row.total_loss
  })

  return [...grouped.values()].sort((a, b) => a.year - b.year)
}

export function getFinancialLossByScamType(scamType) {
  return getTrendByScamType(scamType).map((row) => ({
    year: row.year,
    value: row.total_loss,
  }))
}

export function getAgeDistribution(scamType) {
  const records = dataset.filter((row) => row.scam_type === scamType)
  return groupBySum(records, 'age_group', 'report_count')
}

export function getLocationDistribution(scamType) {
  const records = dataset.filter((row) => row.scam_type === scamType)
  return groupBySum(records, 'location', 'report_count')
}

export function getAggregateSummary() {
  const totalReportedCases = dataset.reduce((sum, row) => sum + row.report_count, 0)
  const totalCombinedLoss = dataset.reduce((sum, row) => sum + row.total_loss, 0)
  const scamTypeCounts = groupBySum(dataset, 'scam_type', 'report_count')
  const topScamType = scamTypeCounts[0] || null

  return {
    totalReportedCases,
    totalCombinedLoss,
    topScamType,
    timePeriod: getTimePeriod(dataset),
    scamTypeCounts,
  }
}

export function getScamTypeRank(scamType) {
  const summary = getAggregateSummary()
  const index = summary.scamTypeCounts.findIndex((row) => row.label === scamType)

  if (index === -1) return null

  return {
    rank: index + 1,
    totalTypes: summary.scamTypeCounts.length,
  }
}

export function getLocationTrendByScamType(scamType) {
  const records = dataset.filter((row) => row.scam_type === scamType)

  if (!records.length) return []

  const grouped = new Map()

  records.forEach((row) => {
    const key = `${row.year}-${row.location}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        year: row.year,
        location: row.location,
        report_count: 0,
        total_loss: 0,
      })
    }

    const item = grouped.get(key)
    item.report_count += row.report_count
    item.total_loss += row.total_loss
  })

  return [...grouped.values()].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.location.localeCompare(b.location)
  })
}

export function getAvailableYears() {
  return [...new Set(dataset.map((row) => row.year))]
    .filter(Boolean)
    .sort((a, b) => a - b)
}

function groupBySum(records, labelKey, valueKey) {
  const grouped = new Map()

  records.forEach((row) => {
    const label = row[labelKey] || 'Unknown'

    if (!grouped.has(label)) {
      grouped.set(label, {
        label,
        value: 0,
      })
    }

    grouped.get(label).value += Number(row[valueKey] || 0)
  })

  return [...grouped.values()].sort((a, b) => b.value - a.value)
}
