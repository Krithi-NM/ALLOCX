const lakh = (value) => Math.round(value * 100000)

const rows = [
  ['CSE', 'AI & Data Science Lab Upgrade', 'Infrastructure', 8.5, 820, 5, 94, true, 6.8, 6.35, 'Submitted'],
  ['CSE', 'Campus Network Core Switches', 'Technology', 5.2, 2400, 5, 91, true, 4.8, 4.56, 'Submitted'],
  ['CSE', 'Student Innovation Seed Fund', 'Research', 4.4, 680, 4, 88, false, 3.2, 2.88, 'Submitted'],
  ['CSE', 'Cloud Computing Credits', 'Technology', 3.1, 560, 3, 81, false, 2.5, 2.31, 'Submitted'],
  ['ECE', 'Embedded Systems Teaching Lab', 'Infrastructure', 7.2, 640, 5, 91, true, 5.6, 5.04, 'Submitted'],
  ['ECE', 'RF & Antenna Measurement Bench', 'Research', 5.4, 280, 4, 87, false, 4.2, 1.6, 'Submitted'],
  ['ECE', 'FPGA Development Kits', 'Equipment', 4.1, 420, 4, 84, false, 3.4, 2.34, 'Submitted'],
  ['ECE', 'Digital Signal Processing Workstations', 'Equipment', 3.8, 350, 3, 79, false, 4.8, 2, 'Submitted'],
  ['EEE', 'Power Systems Protection Lab', 'Infrastructure', 6.3, 440, 5, 90, true, 4.6, 4.37, 'Submitted'],
  ['EEE', 'Renewable Energy Microgrid', 'Research', 5.1, 310, 4, 92, false, 3.7, 3.22, 'Submitted'],
  ['EEE', 'Electrical Safety & Calibration', 'Safety', 2.7, 900, 5, 86, false, 2.1, 1.89, 'Submitted'],
  ['Mechanical', 'CNC Workshop Retrofit', 'Infrastructure', 7.8, 520, 5, 89, true, 6.2, 5.89, 'Submitted'],
  ['Mechanical', 'Electric Vehicle Design Studio', 'Research', 6.1, 360, 4, 93, false, 4.2, 3.78, 'Submitted'],
  ['Mechanical', 'Industrial Metrology Instruments', 'Equipment', 3.6, 480, 3, 78, false, 2.8, 2.38, 'Submitted'],
  ['Civil', 'Structural Testing Frame', 'Infrastructure', 6.9, 430, 5, 90, true, 5.3, 4.93, 'Submitted'],
  ['Civil', 'Surveying Drone Fleet', 'Equipment', 4.8, 390, 4, 85, false, 3.6, 3.13, 'Submitted'],
  ['Civil', 'Materials Testing Consumables', 'Operations', 2.9, 760, 3, 78, false, 2.2, 1.2, 'Submitted'],
  ['ISE', 'Cybersecurity Practice Range', 'Technology', 5.8, 520, 5, 92, true, 4.1, 3.98, 'Submitted'],
  ['ISE', 'Software Engineering Project Studio', 'Infrastructure', 4.6, 740, 4, 86, false, 3.5, 3.15, 'Submitted'],
  ['ISE', 'Open-source Research Grants', 'Research', 3.2, 280, 3, 83, false, 2.4, 2.16, 'Submitted'],
  ['MBA', 'Executive Learning & Case Centre', 'Academic', 4.9, 420, 4, 84, false, 3.8, 3.23, 'Submitted'],
  ['MBA', 'Industry Immersion Programme', 'Academic', 3.8, 360, 4, 88, false, 2.7, 2.38, 'Submitted'],
  ['MBA', 'Digital Market Research Suite', 'Technology', 2.6, 240, 3, 76, false, 1.8, 1.44, 'Submitted'],
  ['Library', 'Institutional E-Journal Renewal', 'Academic', 6.4, 3200, 5, 95, true, 5.7, 5.59, 'Submitted'],
  ['Library', 'Digital Repository & Discovery', 'Technology', 4.3, 1600, 4, 90, false, 3.1, 2.88, 'Submitted'],
  ['Library', 'Accessibility Reading Collection', 'Academic', 2.1, 460, 4, 87, false, 1.6, 1.42, 'Submitted'],
  ['Library', 'Extended Study Room Access', 'Student support', 1.8, 1100, 3, 79, false, 1.2, 0.96, 'Submitted'],
  ['Sports', 'Indoor Court Safety & Flooring', 'Facilities', 5.6, 780, 5, 88, true, 4.2, 3.99, 'Submitted'],
  ['Sports', 'Strength & Conditioning Equipment', 'Equipment', 3.4, 540, 4, 80, false, 2.6, 2.21, 'Submitted'],
  ['Sports', 'Inter-collegiate Athlete Support', 'Student support', 2.8, 320, 3, 82, false, 2.0, 1.62, 'Submitted'],
  ['Administration', 'Campus-wide Fire Alarm Upgrade', 'Safety', 7.1, 4200, 5, 97, true, 6.5, 6.37, 'Submitted'],
  ['Administration', 'Student Records Digitisation', 'Technology', 5.4, 3500, 4, 91, false, 3.6, 3.17, 'Submitted'],
  ['Administration', 'Energy Monitoring & Controls', 'Facilities', 4.2, 2600, 4, 87, false, 3.0, 2.55, 'Submitted'],
  ['Administration', 'Admissions Outreach Expansion', 'Operations', 4.8, 1800, 3, 72, false, 2.5, 1.35, 'Submitted'],
  ['Administration', 'Records Room Archive Fit-out', 'Facilities', 3.0, 900, 2, 68, false, 2.0, 1.64, 'Submitted'],
]

export const departments = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'ISE', 'MBA', 'Library', 'Sports', 'Administration']

export const requests = rows.map((row, index) => {
  const [department, project, category, requestedL, studentsAffected, urgency, alignment, critical, previousL, spentL, status] = row
  const requestedAmount = lakh(requestedL)
  const previousAllocation = lakh(previousL)
  const previousSpending = lakh(spentL)
  return {
    id: `AX-${String(index + 1).padStart(3, '0')}`,
    department,
    project,
    category,
    requestedAmount,
    studentsAffected,
    urgency,
    alignment,
    critical,
    previousAllocation,
    previousSpending,
    status,
  }
})

export const totalBudget = lakh(100)
