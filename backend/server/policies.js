export const emailOk = v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

export const passwordOk = v => 
  typeof v === 'string' &&
  v.length >= 10 &&
  v.length <= 72 &&
  Buffer.byteLength(v, 'utf8') <= 72 &&
  /[a-z]/.test(v) &&
  /[A-Z]/.test(v) &&
  /[0-9]/.test(v);

export const categories = [
  'Roads & Transport',
  'Water & Sanitation',
  'Waste Management',
  'Parks & Public Spaces',
  'Street Lighting',
  'Public Safety',
  'Other'
];

export const priorities = ['Critical', 'High', 'Medium', 'Low'];

export const statusValues = [
  'Submitted',
  'Acknowledged',
  'In Progress',
  'Awaiting Information',
  'Resolved',
  'Closed'
];

export const slaHoursByPriority = {
  Critical: 4,
  High: 24,
  Medium: 48,
  Low: 72
};

export const transitions = {
  'Submitted': ['Acknowledged'],
  'Acknowledged': ['In Progress', 'Awaiting Information'],
  'In Progress': ['Awaiting Information', 'Resolved'],
  'Awaiting Information': ['In Progress'],
  'Resolved': ['Closed'],
  'Closed': []
};
