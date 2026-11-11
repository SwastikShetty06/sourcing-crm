const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = require('../src/config/env');
if (env.NODE_ENV === 'production') {
  process.stderr.write('Seed script cannot run in production environment.\n');
  process.exit(1);
}

const { connectDb } = require('../src/config/db');
const User = require('../src/models/User');
const Lookup = require('../src/models/Lookup');
const Client = require('../src/models/Client');
const { normalizeKey } = require('../src/utils/normalize');

async function seed() {
  await connectDb();

  await Client.deleteMany({});
  await Lookup.deleteMany({});
  await User.deleteMany({});

  const adminPassword = 'AdminPass123';
  const adminPasswordHash = await User.hashPassword(adminPassword);
  const adminUser = await User.create({
    userId: 'admin',
    displayName: 'Admin User',
    passwordHash: adminPasswordHash,
    role: 'admin',
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: new Date()
  });

  process.stdout.write(`Admin user created with userId: admin, password: ${adminPassword}\n`);

  const managerPasswordHash = await User.hashPassword('ManagerPass123');
  const managerUser = await User.create({
    userId: 'vikram.m',
    displayName: 'Vikram Malhotra',
    passwordHash: managerPasswordHash,
    role: 'manager',
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: new Date()
  });

  // 4 CP Firms with 2 CPs each
  const firmDefs = [
    {
      name: 'Sharma Realty',
      cps: ['Rahul Sharma', 'Neha Sharma']
    },
    {
      name: 'Mehta Property Consultants',
      cps: ['Kunal Mehta', 'Rohit Joshi']
    },
    {
      name: 'Desai Advisory Group',
      cps: ['Kunal Desai', 'Ananya Desai']
    },
    {
      name: 'Apex Prime Realty',
      cps: ['Suresh Varma', 'Pooja Shah']
    }
  ];

  const firms = [];
  const cps = [];

  for (const f of firmDefs) {
    const firmDoc = await Lookup.create({
      type: 'cp_firm',
      name: f.name,
      nameKey: normalizeKey(f.name),
      parentId: null,
      createdBy: adminUser._id,
      useCount: 10,
      lastUsedAt: new Date()
    });
    firms.push(firmDoc);

    for (const cpName of f.cps) {
      const cpDoc = await Lookup.create({
        type: 'cp',
        name: cpName,
        nameKey: normalizeKey(cpName),
        parentId: firmDoc._id,
        createdBy: adminUser._id,
        useCount: 5,
        lastUsedAt: new Date()
      });
      cps.push(cpDoc);
    }
  }

  // 3 Callers
  const callerNames = ['Priya Nair', 'Rajesh Nair', 'Kavita Menon'];
  const callers = [];
  for (const name of callerNames) {
    const callerDoc = await Lookup.create({
      type: 'caller',
      name,
      nameKey: normalizeKey(name),
      parentId: null,
      createdBy: adminUser._id,
      useCount: 4,
      lastUsedAt: new Date()
    });
    callers.push(callerDoc);
  }

  // 3 Sales Managers
  const smNames = ['Amit Kulkarni', 'Sneha Patil', 'Rahul Deshmukh'];
  const salesManagers = [];
  for (const name of smNames) {
    const smDoc = await Lookup.create({
      type: 'sales_manager',
      name,
      nameKey: normalizeKey(name),
      parentId: null,
      createdBy: adminUser._id,
      useCount: 8,
      lastUsedAt: new Date()
    });
    salesManagers.push(smDoc);
  }

  // Helper date function
  function daysAgo(days, hours = 10) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hours, 0, 0, 0);
    return d;
  }

  const clientConfigs = [
    {
      clientName: 'Vikram Singhania',
      clientPhone: '9820011223',
      projectName: 'Marina Bay Towers',
      leadSource: 'calling',
      firmIndex: 0,
      cpIndex: 0,
      callerIndex: 0,
      smIndex: 0,
      status: 'in_progress',
      firstVisitDays: 14,
      interactions: [
        { days: 14, kind: 'site_visit', sm: 0, feedback: 'First visit. Showed 3 BHK layout on 18th floor. Liked sea facing balcony.' },
        { days: 9, kind: 'call', sm: 0, feedback: 'Follow up call on pricing and payment plans. Sent cost breakdown.' },
        { days: 2, kind: 'revisit', sm: 1, feedback: 'Client revisited with father. Discussion on floor rise charges.' }
      ]
    },
    {
      clientName: 'Anjali Verma',
      clientPhone: '9820022334',
      projectName: 'Green Meadows',
      leadSource: 'reference',
      firmIndex: 1,
      cpIndex: 2,
      smIndex: 1,
      status: 'booked',
      unitDetails: 'Tower B 1204',
      bookingDate: daysAgo(3),
      firstVisitDays: 20,
      interactions: [
        { days: 20, kind: 'site_visit', sm: 1, feedback: 'Visited project site. Interested in 2.5 BHK garden facing unit.' },
        { days: 12, kind: 'revisit', sm: 1, feedback: 'Second visit. Finalised unit 1204 and requested discount on parking.' },
        { days: 5, kind: 'call', sm: 1, feedback: 'Discount approved by sales head. Booking token scheduled.' },
        { days: 3, kind: 'other', sm: 1, feedback: 'Booking paperwork completed and advance token received.' }
      ]
    },
    {
      clientName: 'Ramesh Iyer',
      clientPhone: '9820033445',
      projectName: 'Skyline Heights',
      leadSource: 'calling',
      firmIndex: 0,
      cpIndex: 1,
      callerIndex: 0,
      smIndex: 2,
      status: 'lost',
      lostReason: 'budget',
      lostNote: 'Looking strictly below 1.2 Cr all inclusive',
      firstVisitDays: 16,
      interactions: [
        { days: 16, kind: 'call', sm: 2, feedback: 'Outbound telecalling lead. Discussed 2 BHK availability.' },
        { days: 10, kind: 'site_visit', sm: 2, feedback: 'Site visit completed. Total ticket size is beyond approved budget.' }
      ]
    },
    {
      clientName: 'Sunita Rao',
      clientPhone: '9820044556',
      projectName: 'Marina Bay Towers',
      leadSource: 'reference',
      firmIndex: 2,
      cpIndex: 4,
      smIndex: 0,
      status: 'in_progress',
      firstVisitDays: 11,
      interactions: [
        { days: 11, kind: 'site_visit', sm: 0, feedback: 'Direct CP reference. Interested in 3 BHK duplex.' },
        { days: 4, kind: 'call', sm: 0, feedback: 'Discussed interior customisation options with developer architect.' }
      ]
    },
    {
      clientName: 'Deepak Kothari',
      clientPhone: '9820055667',
      projectName: 'Emerald Woods',
      leadSource: 'calling',
      firmIndex: 2,
      cpIndex: 5,
      callerIndex: 1,
      smIndex: 1,
      status: 'in_progress',
      firstVisitDays: 12,
      interactions: [
        { days: 12, kind: 'site_visit', sm: 1, feedback: 'Initial inspection of clubhouse and show flat. Positively inclined.' }
      ]
    },
    {
      clientName: 'Meera Sen',
      clientPhone: '9820066778',
      projectName: 'The Palms',
      leadSource: 'reference',
      firmIndex: 3,
      cpIndex: 6,
      smIndex: 2,
      status: 'booked',
      unitDetails: 'Villa 18',
      bookingDate: daysAgo(1),
      firstVisitDays: 25,
      interactions: [
        { days: 25, kind: 'site_visit', sm: 2, feedback: 'Attended walkthrough of individual villa plots.' },
        { days: 15, kind: 'revisit', sm: 2, feedback: 'Family visit with financial advisor. Selected plot 18.' },
        { days: 1, kind: 'other', sm: 2, feedback: 'Booking confirmed and agreement draft shared.' }
      ]
    },
    {
      clientName: 'Sanjay Chawla',
      clientPhone: '9820077889',
      projectName: 'Skyline Heights',
      leadSource: 'calling',
      firmIndex: 0,
      cpIndex: 0,
      callerIndex: 2,
      smIndex: 0,
      status: 'lost',
      lostReason: 'location',
      lostNote: 'Looking near airport corridor only',
      firstVisitDays: 18,
      interactions: [
        { days: 18, kind: 'site_visit', sm: 0, feedback: 'Visited site. Location is too far from children school.' }
      ]
    },
    {
      clientName: 'Harish Patel',
      clientPhone: '9820088990',
      projectName: 'Marina Bay Towers',
      leadSource: 'reference',
      firmIndex: 3,
      cpIndex: 7,
      smIndex: 1,
      status: 'in_progress',
      firstVisitDays: 30,
      interactions: [
        { days: 30, kind: 'site_visit', sm: 1, feedback: 'First visit through Apex Prime. Evaluated 4 BHK penthouse.' },
        { days: 22, kind: 'call', sm: 1, feedback: 'Follow up on structural modifications for living area.' },
        { days: 14, kind: 'revisit', sm: 1, feedback: 'Revisited with vastu consultant. Consultation positive.' },
        { days: 1, kind: 'call', sm: 1, feedback: 'Negotiating final registration timeline.' }
      ]
    },
    {
      clientName: 'Vandana Hegde',
      clientPhone: '9820099001',
      projectName: 'Green Meadows',
      leadSource: 'calling',
      firmIndex: 0,
      cpIndex: 1,
      callerIndex: 2,
      smIndex: 2,
      status: 'booked',
      unitDetails: 'Tower C 801',
      bookingDate: daysAgo(6),
      firstVisitDays: 21,
      interactions: [
        { days: 21, kind: 'site_visit', sm: 2, feedback: 'Visited site. Looked at 3 BHK corner unit.' },
        { days: 6, kind: 'revisit', sm: 2, feedback: 'Closed booking with token cheque.' }
      ]
    },
    {
      clientName: 'Nikhil Gupta',
      clientPhone: '9820100112',
      projectName: 'Skyline Heights',
      leadSource: 'calling',
      firmIndex: 1,
      cpIndex: 2,
      callerIndex: 0,
      smIndex: 0,
      status: 'in_progress',
      firstVisitDays: 15,
      interactions: [
        { days: 15, kind: 'site_visit', sm: 0, feedback: 'Showed show flat. Client said will discuss with spouse and revert.' }
      ]
    },
    {
      clientName: 'Pooja Kamat',
      clientPhone: '9820111223',
      projectName: 'Marina Bay Towers',
      leadSource: 'reference',
      firmIndex: 1,
      cpIndex: 3,
      smIndex: 1,
      status: 'in_progress',
      firstVisitDays: 14,
      interactions: [
        { days: 14, kind: 'call', sm: 1, feedback: 'Phone consultation on 2 BHK availability.' },
        { days: 8, kind: 'site_visit', sm: 1, feedback: 'Site visit completed. Awaiting bank loan pre-approval.' }
      ]
    },
    {
      clientName: 'Arvind Joshi',
      clientPhone: '9820122334',
      projectName: 'Emerald Woods',
      leadSource: 'calling',
      firmIndex: 1,
      cpIndex: 3,
      callerIndex: 1,
      smIndex: 2,
      status: 'lost',
      lostReason: 'chose_competitor',
      lostNote: 'Booked in competing project in same neighbourhood',
      firstVisitDays: 28,
      interactions: [
        { days: 28, kind: 'site_visit', sm: 2, feedback: 'Detailed presentation on amenities and possession timeline.' },
        { days: 19, kind: 'call', sm: 2, feedback: 'Client confirmed purchasing with rival builder due to immediate possession.' }
      ]
    }
  ];

  for (let idx = 0; idx < clientConfigs.length; idx++) {
    const cfg = clientConfigs[idx];
    const creator = adminUser._id;

    const mappedInteractions = cfg.interactions.map(it => ({
      kind: it.kind,
      occurredAt: daysAgo(it.days),
      salesManager: salesManagers[it.sm]._id,
      feedback: it.feedback,
      createdBy: creator
    }));

    const sorted = [...mappedInteractions].sort((a, b) => b.occurredAt - a.occurredAt);

    await Client.create({
      clientName: cfg.clientName,
      clientPhone: cfg.clientPhone,
      projectName: cfg.projectName,
      leadSource: cfg.leadSource,
      cpFirm: cfg.firmIndex !== undefined ? firms[cfg.firmIndex]._id : null,
      cp: cfg.cpIndex !== undefined ? cps[cfg.cpIndex]._id : null,
      caller: (cfg.leadSource === 'calling' && cfg.callerIndex !== undefined) ? callers[cfg.callerIndex]._id : null,
      firstVisitDate: daysAgo(cfg.firstVisitDays),
      interactions: mappedInteractions,
      lastInteractionAt: sorted[0].occurredAt,
      lastSalesManager: sorted[0].salesManager,
      status: cfg.status,
      statusHistory: [
        {
          status: 'in_progress',
          changedAt: daysAgo(cfg.firstVisitDays),
          changedBy: creator,
          note: 'Initial visit'
        },
        ...(cfg.status !== 'in_progress'
          ? [
              {
                status: cfg.status,
                changedAt: cfg.bookingDate || daysAgo(cfg.interactions[cfg.interactions.length - 1].days),
                changedBy: creator,
                note: cfg.status === 'booked' ? 'Client booked unit' : (cfg.lostNote || 'Lead lost')
              }
            ]
          : [])
      ],
      lostReason: cfg.lostReason,
      lostNote: cfg.lostNote,
      unitDetails: cfg.unitDetails,
      bookingDate: cfg.bookingDate,
      isArchived: false,
      createdBy: creator
    });
  }

  // Seed separate private data for managerUser (vikram.m) to verify complete account isolation
  const vikramFirm = await Lookup.create({
    type: 'cp_firm',
    name: 'Kedia Associates',
    nameKey: normalizeKey('Kedia Associates'),
    parentId: null,
    createdBy: managerUser._id,
    useCount: 2,
    lastUsedAt: new Date()
  });

  const vikramCp = await Lookup.create({
    type: 'cp',
    name: 'Nisha Kedia',
    nameKey: normalizeKey('Nisha Kedia'),
    parentId: vikramFirm._id,
    createdBy: managerUser._id,
    useCount: 2,
    lastUsedAt: new Date()
  });

  const vikramCaller = await Lookup.create({
    type: 'caller',
    name: 'Mohit Sen',
    nameKey: normalizeKey('Mohit Sen'),
    parentId: null,
    createdBy: managerUser._id,
    useCount: 2,
    lastUsedAt: new Date()
  });

  const vikramSm = await Lookup.create({
    type: 'sales_manager',
    name: 'Tanvi Rao',
    nameKey: normalizeKey('Tanvi Rao'),
    parentId: null,
    createdBy: managerUser._id,
    useCount: 2,
    lastUsedAt: new Date()
  });

  await Client.create({
    clientName: 'Suresh Raina',
    clientPhone: '9820998877',
    projectName: 'Sunrise Towers',
    leadSource: 'calling',
    cpFirm: vikramFirm._id,
    cp: vikramCp._id,
    caller: vikramCaller._id,
    firstVisitDate: daysAgo(5),
    interactions: [
      {
        kind: 'site_visit',
        occurredAt: daysAgo(5),
        salesManager: vikramSm._id,
        feedback: 'First walkthrough with Tanvi. Liked 2 BHK unit.',
        createdBy: managerUser._id
      }
    ],
    lastInteractionAt: daysAgo(5),
    lastSalesManager: vikramSm._id,
    status: 'in_progress',
    statusHistory: [
      {
        status: 'in_progress',
        changedAt: daysAgo(5),
        changedBy: managerUser._id,
        note: 'Initial visit'
      }
    ],
    isArchived: false,
    createdBy: managerUser._id
  });

  process.stdout.write('Database seeded successfully with test records.\n');
  process.exit(0);
}

seed().catch(err => {
  process.stderr.write(`Seed failed: ${err.message}\n`);
  process.exit(1);
});
