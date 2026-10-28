import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Grievance } from './models.js';

const configuredDns = process.env.DNS_SERVERS?.split(',').map(s => s.trim()).filter(Boolean);
if (configuredDns?.length) {
  dns.setServers(configuredDns);
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic_pulse';

console.log('--- SEEDING CIVIC PULSE DATABASE ---');
console.log('Connecting to database...');
await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
console.log('MongoDB connected.');

// Demo Accounts as strictly specified in the Hackathon master prompt
const demoAccounts = [
  {
    name: 'Asha Patel (Demo Citizen)',
    email: 'citizen@civicpulse.demo',
    password: 'Citizen@123',
    role: 'citizen',
    phone: '+1 555-0101'
  },
  {
    name: 'Devon Ward (Second Citizen)',
    email: 'citizen2@civicpulse.demo',
    password: 'Citizen@123',
    role: 'citizen',
    phone: '+1 555-0102'
  },
  {
    name: 'Marcus Vance (Case Worker 1)',
    email: 'worker@civicpulse.demo',
    password: 'Worker@123',
    role: 'case_worker',
    department: 'Public Works & Roads',
    phone: '+1 555-0103'
  },
  {
    name: 'Sarah Jenkins (Case Worker 2)',
    email: 'worker2@civicpulse.demo',
    password: 'Worker@123',
    role: 'case_worker',
    department: 'Water & Public Sanitation',
    phone: '+1 555-0104'
  },
  {
    name: 'Elena Rostova (Operations Manager)',
    email: 'manager@civicpulse.demo',
    password: 'Manager@123',
    role: 'manager',
    department: 'Municipal Operations',
    phone: '+1 555-0105'
  },
  {
    name: 'David Chen (System Administrator)',
    email: 'admin@civicpulse.demo',
    password: 'Admin@123',
    role: 'admin',
    department: 'Civic Technology Administration',
    phone: '+1 555-0106'
  }
];

const seededUsers = {};

for (const acc of demoAccounts) {
  const passwordHash = await bcrypt.hash(acc.password, 12);
  const user = await User.findOneAndUpdate(
    { email: acc.email.toLowerCase() },
    {
      name: acc.name,
      email: acc.email.toLowerCase(),
      passwordHash,
      role: acc.role,
      active: true,
      department: acc.department,
      phone: acc.phone
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  seededUsers[acc.email] = user;
}

console.log('Demo accounts verified and updated:');
demoAccounts.forEach(a => console.log(`  [${a.role.padEnd(11)}] ${a.email}  (pwd: ${a.password})`));

const now = new Date();
const hoursAgo = h => new Date(now.getTime() - h * 3600 * 1000);
const hoursFromNow = h => new Date(now.getTime() + h * 3600 * 1000);

// Sample Fictional Grievances with Controlled Timestamps
const sampleGrievances = [
  // 1. Critical Overdue & Escalated Case
  {
    reference: 'CP-2026-1001',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Burst water main flooding residential intersection',
    description: 'A major water main ruptured at the intersection of Maple St and 4th Ave. Potable water is surging down the street, flooding driveways and threatening basements. Urgent municipal shutoff and repair crew required immediately.',
    category: 'Water & Sanitation',
    location: 'Corner of Maple Street & 4th Avenue',
    priority: 'Critical', // 4 hr SLA
    status: 'In Progress',
    assignee: seededUsers['worker2@civicpulse.demo']._id,
    submittedAt: hoursAgo(10),
    slaDeadline: hoursAgo(6), // Overdue by 6 hours
    escalation: {
      level: 1,
      reason: 'Critical SLA deadline exceeded (4h policy). Water main rupture unchecked.',
      triggeredAt: hoursAgo(5),
      state: 'open'
    },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Grievance submitted by citizen', at: hoursAgo(10) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['manager@civicpulse.demo']._id, note: 'Flagged for emergency dispatch', at: hoursAgo(9.5) },
      { previousStatus: 'Acknowledged', status: 'In Progress', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Dispatched emergency valve crew to isolate main break', at: hoursAgo(7) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker2@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Emergency plumbing and utility response', at: hoursAgo(9.5) }
    ]
  },

  // 2. High Priority Overdue Case (Acknowledged escalation)
  {
    reference: 'CP-2026-1002',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Dangerous deep pothole damaged two vehicle rims',
    description: 'A crater-sized pothole has opened up in the fast lane on West Grand Boulevard. Multiple drivers have suffered blown tires and bent rims in the dark. Requires asphalt cold-patch before morning rush hour.',
    category: 'Roads & Transport',
    location: 'West Grand Blvd near Highway 102 Offramp',
    priority: 'High', // 24 hr SLA
    status: 'Acknowledged',
    assignee: seededUsers['worker@civicpulse.demo']._id,
    submittedAt: hoursAgo(30),
    slaDeadline: hoursAgo(6), // Overdue by 6 hours
    escalation: {
      level: 1,
      reason: 'High priority SLA expired after 24h without repair initiation.',
      triggeredAt: hoursAgo(5),
      state: 'acknowledged'
    },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Citizen report filed with photo telemetry', at: hoursAgo(30) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Road safety inspectors assigned work ticket #RD-994', at: hoursAgo(28) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Assigned to Ward 3 asphalt patching unit', at: hoursAgo(29) }
    ]
  },

  // 3. In Progress Case assigned to Worker 1
  {
    reference: 'CP-2026-1003',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Street light array flickering and blacked out near school',
    description: 'Three consecutive high-pressure sodium street lamps are completely dark outside Lincoln Elementary School. Parents and students walking to evening events are forced into pitch black sidewalk stretches.',
    category: 'Street Lighting',
    location: '1200 Lincoln Way across from Middle School Gate',
    priority: 'Medium', // 48 hr SLA
    status: 'In Progress',
    assignee: seededUsers['worker@civicpulse.demo']._id,
    submittedAt: hoursAgo(12),
    slaDeadline: hoursFromNow(36),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Grievance submitted', at: hoursAgo(12) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Acknowledged by electrical maintenance team', at: hoursAgo(10) },
      { previousStatus: 'Acknowledged', status: 'In Progress', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Bucket truck crew on site replacing ballast and photocell sensor', at: hoursAgo(2) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Electrical infrastructure division', at: hoursAgo(11) }
    ]
  },

  // 4. Resolved Grievance with Detailed Resolution Note
  {
    reference: 'CP-2026-1004',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Overflowing municipal dumpsters attracting pests in public park',
    description: 'The recycling and green waste bins adjacent to the central pavilion in Oak Ridge Park have overflowed for four days. Food debris is scattered across the lawn attracting rodents and raccoons.',
    category: 'Waste Management',
    location: 'Oak Ridge Park, Central Picnic Pavilion',
    priority: 'Medium',
    status: 'Resolved',
    assignee: seededUsers['worker2@civicpulse.demo']._id,
    submittedAt: hoursAgo(40),
    slaDeadline: hoursAgo(-8),
    resolutionNote: 'Parks sanitation crew emptied all four municipal waste containers, pressure-washed the concrete dumpster pad, and installed two additional wildlife-resistant bins. New bi-weekly weekend collection route added.',
    resolvedAt: hoursAgo(4),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Citizen report filed', at: hoursAgo(40) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Sanitation route supervisor assigned', at: hoursAgo(36) },
      { previousStatus: 'Acknowledged', status: 'In Progress', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Collection vehicle dispatched with pressure washer', at: hoursAgo(10) },
      { previousStatus: 'In Progress', status: 'Resolved', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Bins emptied, sanitized and wildlife-deterrent covers installed.', at: hoursAgo(4) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker2@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Assigned to Park Sanitation services', at: hoursAgo(38) }
    ]
  },

  // 5. Closed Grievance
  {
    reference: 'CP-2026-1005',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Fallen tree limb blocking community walking trail',
    description: 'A large oak bough snapped during Tuesday storm winds and completely blocked the pedestrian path near the duck pond. Prams and wheelchairs cannot pass.',
    category: 'Parks & Public Spaces',
    location: 'Meadowbrook Greenway Trail, mile marker 1.4',
    priority: 'Low',
    status: 'Closed',
    assignee: seededUsers['worker@civicpulse.demo']._id,
    submittedAt: hoursAgo(90),
    slaDeadline: hoursAgo(18),
    resolutionNote: 'Forestry service arborists cut down and chipped the hazardous branch. Path cleared and swept clean. Citizen confirmed resolution.',
    resolvedAt: hoursAgo(24),
    closedAt: hoursAgo(12),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Grievance submitted', at: hoursAgo(90) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Arbor team scheduled', at: hoursAgo(80) },
      { previousStatus: 'Acknowledged', status: 'In Progress', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Tree removal crew on site with wood chipper', at: hoursAgo(48) },
      { previousStatus: 'In Progress', status: 'Resolved', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Path cleared and verified safe', at: hoursAgo(24) },
      { previousStatus: 'Resolved', status: 'Closed', actor: seededUsers['manager@civicpulse.demo']._id, note: 'Case verified and closed after citizen satisfaction check', at: hoursAgo(12) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Assigned to Urban Forestry squad', at: hoursAgo(85) }
    ]
  },

  // 6. Awaiting Information Status Case
  {
    reference: 'CP-2026-1006',
    citizen: seededUsers['citizen2@civicpulse.demo']._id,
    title: 'Low water pressure and discolored tap water in multi-family unit',
    description: 'Tap water pressure dropped dramatically yesterday morning and has a cloudy, brownish tint. We are concerned about potential contamination or backflow.',
    category: 'Water & Sanitation',
    location: 'Highland Ridge Apartments, Elm Street corridor',
    priority: 'High',
    status: 'Awaiting Information',
    assignee: seededUsers['worker2@civicpulse.demo']._id,
    submittedAt: hoursAgo(18),
    slaDeadline: hoursFromNow(6),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen2@civicpulse.demo']._id, note: 'Grievance submitted by citizen', at: hoursAgo(18) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Acknowledged by Water Quality team', at: hoursAgo(15) },
      { previousStatus: 'Acknowledged', status: 'Awaiting Information', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Requested specific apartment building numbers and confirmation if problem affects internal plumbing or whole street', at: hoursAgo(12) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker2@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Assigned to Water Quality Testing division', at: hoursAgo(16) }
    ]
  },

  // 7. Unassigned Pending Case (Visible to Manager for Assignment)
  {
    reference: 'CP-2026-1007',
    citizen: seededUsers['citizen2@civicpulse.demo']._id,
    title: 'Pedestrian signal push-button broken at busy 4-lane crossing',
    description: 'The pedestrian crossing button on the northeast corner of 8th Avenue and Broadway is physically jammed. Pedestrians cannot trigger the walk signal, leading to dangerous jaywalking across fast traffic.',
    category: 'Public Safety',
    location: 'Northeast corner of 8th Ave & Broadway Ave',
    priority: 'High',
    status: 'Submitted',
    assignee: null, // Ready for Manager assignment demonstration!
    submittedAt: hoursAgo(3),
    slaDeadline: hoursFromNow(21),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen2@civicpulse.demo']._id, note: 'New civic report submitted via portal', at: hoursAgo(3) }
    ],
    assignmentHistory: []
  },

  // 8. Unassigned Fresh Submission (Low priority)
  {
    reference: 'CP-2026-1008',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Graffiti vandalism on historic park perimeter stone wall',
    description: 'Spray-painted graffiti tags were painted across 30 feet of the heritage limestone boundary wall along Pinecrest Botanical Park. Needs non-abrasive solvent cleaning.',
    category: 'Parks & Public Spaces',
    location: 'Pinecrest Botanical Gardens, South Perimeter Wall',
    priority: 'Low',
    status: 'Submitted',
    assignee: null, // Ready for Manager assignment
    submittedAt: hoursAgo(5),
    slaDeadline: hoursFromNow(67),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Grievance submitted by citizen', at: hoursAgo(5) }
    ],
    assignmentHistory: []
  },

  // 9. Reopened Grievance
  {
    reference: 'CP-2026-1009',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Storm sewer drain clogged causing street flooding during downpours',
    description: 'The catch basin grate at the bottom of the cul-de-sac is choked with asphalt runoff, gravel, and autumn leaves. Water ponds up to 10 inches deep across both sidewalks.',
    category: 'Water & Sanitation',
    location: '34 Willowbrook Court cul-de-sac',
    priority: 'Medium',
    status: 'In Progress',
    assignee: seededUsers['worker2@civicpulse.demo']._id,
    submittedAt: hoursAgo(50),
    slaDeadline: hoursFromNow(20),
    reopenedAt: hoursAgo(6),
    reopenReason: 'After first rain yesterday, drain clogged again within 2 hours. Root obstruction inside pipe identified.',
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Report filed', at: hoursAgo(50) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Catch basin inspection scheduled', at: hoursAgo(45) },
      { previousStatus: 'Acknowledged', status: 'In Progress', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Vacuum truck cleared surface debris', at: hoursAgo(30) },
      { previousStatus: 'In Progress', status: 'Resolved', actor: seededUsers['worker2@civicpulse.demo']._id, note: 'Surface leaves removed and grate inspected', at: hoursAgo(20) },
      { previousStatus: 'Resolved', status: 'In Progress', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Reopened: After first rain yesterday, drain clogged again within 2 hours. Root obstruction inside pipe identified.', at: hoursAgo(6) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker2@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Stormwater infrastructure maintenance', at: hoursAgo(46) }
    ]
  },

  // 10. Acknowledged Case assigned to Worker 1
  {
    reference: 'CP-2026-1010',
    citizen: seededUsers['citizen2@civicpulse.demo']._id,
    title: 'Damaged speed limit sign bent by delivery truck',
    description: 'A 25 MPH residential speed limit sign was hit by a turning truck and is bent at a 45-degree angle into the bike lane, creating a collision risk for cyclists.',
    category: 'Roads & Transport',
    location: 'Cloverdale Road near Cedar Lane',
    priority: 'Medium',
    status: 'Acknowledged',
    assignee: seededUsers['worker@civicpulse.demo']._id,
    submittedAt: hoursAgo(8),
    slaDeadline: hoursFromNow(40),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen2@civicpulse.demo']._id, note: 'Grievance submitted by citizen', at: hoursAgo(8) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Sign replacement scheduled with sign shop #WK-441', at: hoursAgo(5) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Traffic signage division', at: hoursAgo(6) }
    ]
  },

  // 11. Overdue Case (Medium Priority overdue by 4 hours)
  {
    reference: 'CP-2026-1011',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Illegal commercial dumping of construction drywall in alleyway',
    description: 'Over twenty bags of torn drywall and insulation were dumped overnight behind the alley of 450 Commercial Street. The alley is partially blocked and insulation fibers are blowing in the wind.',
    category: 'Waste Management',
    location: 'Alley behind 450 Commercial Street',
    priority: 'Medium', // 48 hr SLA
    status: 'In Progress',
    assignee: seededUsers['worker@civicpulse.demo']._id,
    submittedAt: hoursAgo(52),
    slaDeadline: hoursAgo(4), // Overdue by 4 hours
    escalation: {
      level: 1,
      reason: 'Medium priority SLA exceeded (48h policy). Hazardous construction debris remains uncollected.',
      triggeredAt: hoursAgo(3),
      state: 'open'
    },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Citizen reported commercial dumping', at: hoursAgo(52) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Enforcement and removal notice created', at: hoursAgo(45) },
      { previousStatus: 'Acknowledged', status: 'In Progress', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Heavy flatbed truck requested from central yard', at: hoursAgo(20) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Assigned to code compliance and bulk waste team', at: hoursAgo(46) }
    ]
  },

  // 12. Public Safety Concern - Newly Acknowledged
  {
    reference: 'CP-2026-1012',
    citizen: seededUsers['citizen@civicpulse.demo']._id,
    title: 'Broken safety railing on pedestrian footbridge over railway',
    description: 'A 6-foot section of the safety balustrade on the pedestrian footbridge has snapped off, leaving a sheer 25-foot drop directly down to the freight tracks. Requires immediate safety barrier installation.',
    category: 'Public Safety',
    location: 'Parkview Footbridge over Union Pacific Railway Line',
    priority: 'Critical',
    status: 'Acknowledged',
    assignee: seededUsers['worker@civicpulse.demo']._id,
    submittedAt: hoursAgo(1),
    slaDeadline: hoursFromNow(3),
    escalation: { level: 0, reason: null, triggeredAt: null, state: 'none' },
    history: [
      { previousStatus: null, status: 'Submitted', actor: seededUsers['citizen@civicpulse.demo']._id, note: 'Urgent citizen safety report submitted', at: hoursAgo(1) },
      { previousStatus: 'Submitted', status: 'Acknowledged', actor: seededUsers['worker@civicpulse.demo']._id, note: 'Bridge safety engineer alerted, temporary barricades en route', at: hoursAgo(0.5) }
    ],
    assignmentHistory: [
      { from: null, to: seededUsers['worker@civicpulse.demo']._id, actor: seededUsers['manager@civicpulse.demo']._id, reason: 'Critical bridge infrastructure emergency', at: hoursAgo(0.8) }
    ]
  }
];

let seededCount = 0;
for (const g of sampleGrievances) {
  await Grievance.findOneAndUpdate(
    { reference: g.reference },
    g,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  seededCount++;
}

console.log(`Successfully seeded ${seededCount} realistic sample grievances:`);
console.log('  - Active open cases across categories & priorities');
console.log('  - 3 Overdue test cases with SLA breaches');
console.log('  - 2 Open and acknowledged escalation records');
console.log('  - 2 Resolved and Closed cases with resolution audit notes');
console.log('  - 1 Reopened case with citizen audit history');
console.log('  - 2 Unassigned cases ready for manager assignment testing');
console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');

await mongoose.disconnect();
process.exit(0);
