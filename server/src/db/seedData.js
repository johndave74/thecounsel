// Seed dataset — mirrors the frontend's src/data/sampleData.js so the API
// serves the same matters/clients/hearings the prototype was designed around.
// Every seeded user shares the demo password below.
export const DEMO_PASSWORD = 'demo1234'

export const users = [
  { id: 'l1', name: 'Adaeze Okonkwo', role: 'Admin', title: 'Managing Partner', specialty: 'Corporate Law', email: 'a.okonkwo@counsel.law', phone: '+1 (415) 555-0188', winRate: 91, tone: 0, barNo: 'CA-184320' },
  { id: 'l2', name: 'Julian Mercer', role: 'Lawyer', title: 'Senior Partner', specialty: 'Litigation', email: 'j.mercer@counsel.law', phone: '+1 (415) 555-0142', winRate: 84, tone: 1, barNo: 'CA-176554' },
  { id: 'l3', name: 'Priya Nair', role: 'Lawyer', title: 'Associate', specialty: 'Family Law', email: 'p.nair@counsel.law', phone: '+1 (415) 555-0119', winRate: 78, tone: 2, barNo: 'CA-201887' },
  { id: 'l4', name: 'Marcus Reyes', role: 'Lawyer', title: 'Associate', specialty: 'Criminal Defense', email: 'm.reyes@counsel.law', phone: '+1 (415) 555-0173', winRate: 73, tone: 4, barNo: 'CA-209441' },
  { id: 'l5', name: 'Hannah Bloom', role: 'Staff', title: 'Senior Paralegal', specialty: 'Document Review', email: 'h.bloom@counsel.law', phone: '+1 (415) 555-0155', winRate: null, tone: 3, barNo: '—' },
  { id: 'l6', name: 'Daniel Foster', role: 'Staff', title: 'Legal Assistant', specialty: 'Intake & Scheduling', email: 'd.foster@counsel.law', phone: '+1 (415) 555-0166', winRate: null, tone: 5, barNo: '—' },
]

export const clients = [
  { id: 'c1', name: 'Helena Whitmore', type: 'Individual', company: null, email: 'helena.w@gmail.com', phone: '+1 (212) 555-0101', since: '2023-02-14', tone: 0, address: 'Brooklyn, NY' },
  { id: 'c2', name: 'Northwind Logistics', type: 'Corporate', company: 'Northwind Logistics LLC', email: 'legal@northwind.co', phone: '+1 (415) 555-0420', since: '2021-09-03', tone: 1, address: 'Oakland, CA' },
  { id: 'c3', name: 'Theodore Sloane', type: 'Individual', company: null, email: 't.sloane@outlook.com', phone: '+1 (310) 555-0199', since: '2024-01-22', tone: 2, address: 'Los Angeles, CA' },
  { id: 'c4', name: 'Verde Organics', type: 'Corporate', company: 'Verde Organics Inc.', email: 'counsel@verde.org', phone: '+1 (503) 555-0312', since: '2022-06-30', tone: 3, address: 'Portland, OR' },
  { id: 'c5', name: 'Maria Castellano', type: 'Individual', company: null, email: 'm.castellano@proton.me', phone: '+1 (646) 555-0277', since: '2023-11-08', tone: 4, address: 'Queens, NY' },
  { id: 'c6', name: 'Atlas Property Group', type: 'Corporate', company: 'Atlas Property Group', email: 'disputes@atlaspg.com', phone: '+1 (415) 555-0588', since: '2020-03-17', tone: 5, address: 'San Francisco, CA' },
  { id: 'c7', name: 'James Okafor', type: 'Individual', company: null, email: 'j.okafor@gmail.com', phone: '+1 (281) 555-0344', since: '2024-04-02', tone: 1, address: 'Houston, TX' },
  { id: 'c8', name: 'Lumen Health Systems', type: 'Corporate', company: 'Lumen Health Systems', email: 'legal@lumenhs.com', phone: '+1 (617) 555-0466', since: '2023-07-19', tone: 2, address: 'Boston, MA' },
]

export const cases = [
  { id: 'CASE-2041', number: '2024-CV-2041', title: 'Whitmore v. Stratton Holdings', clientId: 'c1', lawyerIds: ['l2', 'l5'], status: 'In Court', practice: 'Civil Litigation', priority: 'High', opened: '2024-03-12', court: 'Superior Court of CA, Dept. 14', judge: 'Hon. R. Delgado', progress: 68, value: '$420,000', nextHearing: '2026-06-09', desc: 'Breach of contract and damages claim against Stratton Holdings concerning a failed commercial lease agreement and withheld security deposit.' },
  { id: 'CASE-2038', number: '2024-CR-2038', title: 'State v. Reyes (Theodore Sloane)', clientId: 'c3', lawyerIds: ['l4'], status: 'Pending', practice: 'Criminal Defense', priority: 'High', opened: '2024-01-25', court: 'County Criminal Court, Div. 3', judge: 'Hon. M. Tanaka', progress: 34, value: '—', nextHearing: '2026-06-15', desc: 'Defense representation on felony charges. Currently in pre-trial motions; awaiting ruling on suppression of evidence.' },
  { id: 'CASE-1990', number: '2023-CP-1990', title: 'Northwind Logistics — Vendor Dispute', clientId: 'c2', lawyerIds: ['l1', 'l3'], status: 'Open', practice: 'Corporate Law', priority: 'Medium', opened: '2023-11-02', court: 'Commercial Arbitration Panel', judge: 'Arbitrator P. Hassan', progress: 22, value: '$1.2M', nextHearing: '2026-06-22', desc: 'Contractual dispute with a freight subcontractor over service-level failures and liquidated damages clauses.' },
  { id: 'CASE-2055', number: '2024-FA-2055', title: 'Castellano Custody Petition', clientId: 'c5', lawyerIds: ['l3'], status: 'In Court', practice: 'Family Law', priority: 'High', opened: '2024-04-18', court: 'Family Court, Dept. 7', judge: 'Hon. L. Avery', progress: 55, value: '—', nextHearing: '2026-06-11', desc: 'Petition for modification of custody arrangement and child support. Mediation unsuccessful; proceeding to evidentiary hearing.' },
  { id: 'CASE-1840', number: '2022-CV-1840', title: 'Verde Organics — Trademark Infringement', clientId: 'c4', lawyerIds: ['l1', 'l2'], status: 'Won', practice: 'Intellectual Property', priority: 'Medium', opened: '2022-07-09', court: 'US District Court, N.D. Cal.', judge: 'Hon. S. Whitfield', progress: 100, value: '$650,000', nextHearing: null, desc: 'Successfully enjoined a competitor from using a confusingly similar mark; awarded damages and legal fees.' },
  { id: 'CASE-2012', number: '2023-RE-2012', title: 'Atlas Property — Boundary Dispute', clientId: 'c6', lawyerIds: ['l2'], status: 'Pending', practice: 'Real Estate', priority: 'Low', opened: '2023-12-15', court: 'Superior Court of CA, Dept. 9', judge: 'Hon. K. Romero', progress: 41, value: '$180,000', nextHearing: '2026-06-30', desc: 'Quiet title action regarding a contested easement between adjacent commercial parcels.' },
  { id: 'CASE-1755', number: '2022-CV-1755', title: 'Okafor Personal Injury Claim', clientId: 'c7', lawyerIds: ['l4', 'l6'], status: 'Closed', practice: 'Personal Injury', priority: 'Medium', opened: '2022-04-05', court: 'Settled — Pre-trial', judge: '—', progress: 100, value: '$95,000', nextHearing: null, desc: 'Auto-accident injury claim. Resolved through negotiated settlement prior to trial.' },
  { id: 'CASE-1602', number: '2021-CV-1602', title: 'Lumen Health — Employment Matter', clientId: 'c8', lawyerIds: ['l1'], status: 'Lost', practice: 'Employment Law', priority: 'Medium', opened: '2021-10-21', court: 'Superior Court of CA, Dept. 2', judge: 'Hon. D. Park', progress: 100, value: '$240,000', nextHearing: null, desc: 'Wrongful termination defense. Jury returned an adverse verdict; appeal options under review.' },
  { id: 'CASE-2061', number: '2024-CP-2061', title: 'Northwind — Insurance Coverage', clientId: 'c2', lawyerIds: ['l3', 'l5'], status: 'Open', practice: 'Insurance Law', priority: 'Low', opened: '2024-05-02', court: 'Pre-litigation', judge: '—', progress: 12, value: '$330,000', nextHearing: '2026-07-05', desc: 'Coverage dispute with carrier over denial of a cargo-loss claim under the commercial policy.' },
]

export const hearings = [
  { id: 'h1', caseId: 'CASE-2055', title: 'Castellano — Evidentiary Hearing', date: '2026-06-11', time: '09:30', court: 'Family Court, Dept. 7', judge: 'Hon. L. Avery', type: 'court', status: 'Confirmed' },
  { id: 'h2', caseId: 'CASE-2041', title: 'Whitmore — Motion Hearing', date: '2026-06-09', time: '11:00', court: 'Superior Court, Dept. 14', judge: 'Hon. R. Delgado', type: 'court', status: 'Confirmed' },
  { id: 'h3', caseId: 'CASE-2038', title: 'Sloane — Pre-trial Conference', date: '2026-06-15', time: '14:00', court: 'Criminal Court, Div. 3', judge: 'Hon. M. Tanaka', type: 'hearing', status: 'Tentative' },
  { id: 'h4', caseId: 'CASE-1990', title: 'Northwind — Arbitration Session', date: '2026-06-22', time: '10:00', court: 'Arbitration Panel', judge: 'Arb. P. Hassan', type: 'hearing', status: 'Confirmed' },
  { id: 'h5', caseId: 'CASE-2041', title: 'Whitmore — Discovery Deadline', date: '2026-06-06', time: '17:00', court: '—', judge: '—', type: 'deadline', status: 'Due' },
  { id: 'h6', caseId: 'CASE-2012', title: 'Atlas — Status Conference', date: '2026-06-30', time: '13:30', court: 'Superior Court, Dept. 9', judge: 'Hon. K. Romero', type: 'court', status: 'Confirmed' },
  { id: 'h7', caseId: 'CASE-2061', title: 'Northwind — Client Strategy Meeting', date: '2026-06-18', time: '15:00', court: 'Conference Room B', judge: '—', type: 'meeting', status: 'Confirmed' },
  { id: 'h8', caseId: 'CASE-2038', title: 'Sloane — Filing Deadline (Motion)', date: '2026-06-13', time: '17:00', court: '—', judge: '—', type: 'deadline', status: 'Due' },
  { id: 'h9', caseId: 'CASE-2055', title: 'Castellano — Mediation Follow-up', date: '2026-06-25', time: '10:30', court: 'Conference Room A', judge: '—', type: 'meeting', status: 'Tentative' },
]

export const documents = [
  { id: 'd1', name: 'Complaint & Summons.pdf', ext: 'pdf', caseId: 'CASE-2041', category: 'Pleadings', size: '2.4 MB', uploadedBy: 'Julian Mercer', date: '2024-03-12' },
  { id: 'd2', name: 'Lease Agreement (Executed).pdf', ext: 'pdf', caseId: 'CASE-2041', category: 'Evidence', size: '1.1 MB', uploadedBy: 'Hannah Bloom', date: '2024-03-15' },
  { id: 'd3', name: 'Suppression Motion Draft.docx', ext: 'doc', caseId: 'CASE-2038', category: 'Motions', size: '88 KB', uploadedBy: 'Marcus Reyes', date: '2024-05-20' },
  { id: 'd4', name: 'Vendor Service Contract.pdf', ext: 'pdf', caseId: 'CASE-1990', category: 'Contracts', size: '640 KB', uploadedBy: 'Priya Nair', date: '2023-11-04' },
  { id: 'd5', name: 'Custody Evaluation Report.pdf', ext: 'pdf', caseId: 'CASE-2055', category: 'Reports', size: '3.7 MB', uploadedBy: 'Priya Nair', date: '2024-05-28' },
  { id: 'd6', name: 'Trademark Registration.pdf', ext: 'pdf', caseId: 'CASE-1840', category: 'Evidence', size: '420 KB', uploadedBy: 'Adaeze Okonkwo', date: '2022-07-10' },
  { id: 'd7', name: 'Damages Calculation.xlsx', ext: 'xls', caseId: 'CASE-1990', category: 'Financials', size: '210 KB', uploadedBy: 'Hannah Bloom', date: '2024-02-11' },
  { id: 'd8', name: 'Site Survey Photos.zip', ext: 'zip', caseId: 'CASE-2012', category: 'Evidence', size: '14.2 MB', uploadedBy: 'Daniel Foster', date: '2024-01-18' },
  { id: 'd9', name: 'Settlement Agreement.pdf', ext: 'pdf', caseId: 'CASE-1755', category: 'Settlement', size: '780 KB', uploadedBy: 'Marcus Reyes', date: '2023-09-30' },
  { id: 'd10', name: 'Property Boundary Map.png', ext: 'img', caseId: 'CASE-2012', category: 'Evidence', size: '5.1 MB', uploadedBy: 'Daniel Foster', date: '2024-01-18' },
  { id: 'd11', name: 'Insurance Policy (Full).pdf', ext: 'pdf', caseId: 'CASE-2061', category: 'Contracts', size: '1.9 MB', uploadedBy: 'Hannah Bloom', date: '2024-05-03' },
  { id: 'd12', name: 'Witness Statement — H. Castellano.docx', ext: 'doc', caseId: 'CASE-2055', category: 'Statements', size: '64 KB', uploadedBy: 'Priya Nair', date: '2024-06-01' },
]

export const tasks = [
  { id: 't1', title: 'File reply brief for Whitmore motion', caseId: 'CASE-2041', assigneeId: 'l2', due: '2026-06-07', priority: 'High', done: false },
  { id: 't2', title: 'Prepare exhibit binder — Castellano hearing', caseId: 'CASE-2055', assigneeId: 'l5', due: '2026-06-10', priority: 'High', done: false },
  { id: 't3', title: 'Draft suppression motion — Sloane', caseId: 'CASE-2038', assigneeId: 'l4', due: '2026-06-12', priority: 'High', done: false },
  { id: 't4', title: 'Review vendor contract clauses', caseId: 'CASE-1990', assigneeId: 'l3', due: '2026-06-16', priority: 'Medium', done: false },
  { id: 't5', title: 'Schedule deposition — Northwind dispute', caseId: 'CASE-1990', assigneeId: 'l6', due: '2026-06-20', priority: 'Medium', done: false },
  { id: 't6', title: 'Send engagement letter — new intake', caseId: 'CASE-2061', assigneeId: 'l6', due: '2026-06-05', priority: 'Low', done: true },
  { id: 't7', title: 'Organize discovery documents', caseId: 'CASE-2041', assigneeId: 'l5', due: '2026-06-06', priority: 'High', done: false },
  { id: 't8', title: 'Client update call — Atlas boundary case', caseId: 'CASE-2012', assigneeId: 'l2', due: '2026-06-08', priority: 'Low', done: false },
  { id: 't9', title: 'Confirm expert witness availability', caseId: 'CASE-2055', assigneeId: 'l3', due: '2026-06-09', priority: 'Medium', done: false },
  { id: 't10', title: 'Finalize settlement paperwork', caseId: 'CASE-1755', assigneeId: 'l4', due: '2026-05-28', priority: 'Medium', done: true },
]

// minutesAgo: how long before "now" each notification was created (for relative time)
export const notifications = [
  { id: 'n1', kind: 'warn', title: 'Discovery deadline tomorrow', body: 'Whitmore v. Stratton Holdings — discovery cutoff is June 6 at 5:00 PM.', unread: true, minutesAgo: -1320 },
  { id: 'n2', kind: 'cal', title: 'Hearing in 2 days', body: 'Castellano evidentiary hearing — June 11, 9:30 AM, Family Court Dept. 7.', unread: true, minutesAgo: -2880 },
  { id: 'n3', kind: 'cal', title: 'Motion hearing scheduled', body: 'Whitmore motion hearing confirmed for June 9, 11:00 AM, Dept. 14.', unread: true, minutesAgo: -4320 },
  { id: 'n4', kind: 'info', title: 'New document uploaded', body: 'Hannah Bloom added "Witness Statement — H. Castellano.docx" to CASE-2055.', unread: false, minutesAgo: 300 },
  { id: 'n5', kind: 'ok', title: 'Task completed', body: 'Marcus Reyes marked "Finalize settlement paperwork" as done.', unread: false, minutesAgo: 1440 },
  { id: 'n6', kind: 'warn', title: 'Filing deadline approaching', body: 'Sloane motion filing due June 13 at 5:00 PM.', unread: false, minutesAgo: -11520 },
]

export const timeline = {
  'CASE-2041': [
    { date: '2024-03-12', title: 'Case opened', desc: 'Complaint filed with the Superior Court of California.' },
    { date: '2024-03-28', title: 'Defendant served', desc: 'Stratton Holdings served with summons and complaint.' },
    { date: '2024-04-30', title: 'Answer filed', desc: 'Defendant filed answer with affirmative defenses.' },
    { date: '2024-05-22', title: 'Discovery commenced', desc: 'Interrogatories and document requests exchanged.' },
    { date: '2026-06-09', title: 'Motion hearing', desc: 'Hearing on motion to compel scheduled, Dept. 14.' },
  ],
  'CASE-2055': [
    { date: '2024-04-18', title: 'Petition filed', desc: 'Custody modification petition filed in Family Court.' },
    { date: '2024-05-10', title: 'Mediation held', desc: 'Court-ordered mediation; no agreement reached.' },
    { date: '2024-05-28', title: 'Evaluation received', desc: 'Custody evaluation report submitted to the court.' },
    { date: '2026-06-11', title: 'Evidentiary hearing', desc: 'Hearing set before Hon. L. Avery, Dept. 7.' },
  ],
}

export const notes = {
  'CASE-2041': [
    { id: 'no1', authorId: 'l2', author: 'Julian Mercer', initials: 'JM', tone: 1, date: '2026-06-02', text: 'Client confirmed she retained all original correspondence regarding the deposit. We should enter these as exhibits before the motion hearing.' },
    { id: 'no2', authorId: 'l5', author: 'Hannah Bloom', initials: 'HB', tone: 3, date: '2026-05-30', text: 'Discovery binder is 80% assembled. Waiting on two bank statements from the client to complete the financials section.' },
  ],
  'CASE-2055': [
    { id: 'no3', authorId: 'l3', author: 'Priya Nair', initials: 'PN', tone: 2, date: '2026-06-01', text: 'Custody evaluator is available to testify on the 11th. Need to confirm the exhibit list and prep the client for cross-examination.' },
  ],
}

export const initialsOf = (name) =>
  (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
