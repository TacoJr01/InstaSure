require('dotenv').config();
const mongoose = require('mongoose');
const crypto   = require('crypto');
const { Worker, Payout, FraudFlag, AdminAlert, WorkerAlert, AdminSettings } = require('./models');

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex').slice(0, 16);
}

const SEED_WORKERS = [
  { id:'u1', name:'Rahul Sharma',   initials:'RS', phone:'9100000001', pin:hashPin('1234'), platform:'Swiggy',  location:'Chennai',   zone:'Velachery',       gtsScore:742, gtsTier:'high',   status:'active',  weeklyEarnings:950,  premium:40, lastActive:'2 min ago',  upi:'rahul@upi',  workHours:'10 AM – 10 PM', memberSince:'Jan 2024', activeDeliveryDays:21, policyNumber:'ISP-2024-0001', policyStart:'6 Jan 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:800, lowOrders:500, pollution:200, curfew:300}, compensationEligible:true },
  { id:'u2', name:'Priya Nair',     initials:'PN', phone:'9100000002', pin:hashPin('1234'), platform:'Zomato',  location:'Mumbai',    zone:'Andheri West',    gtsScore:612, gtsTier:'medium', status:'active',  weeklyEarnings:650,  premium:35, lastActive:'15 min ago', upi:'priya@upi',  workHours:'8 AM – 8 PM',   memberSince:'Mar 2024', activeDeliveryDays:14, policyNumber:'ISP-2024-0002', policyStart:'4 Mar 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:1000,lowOrders:400, pollution:100, curfew:200} },
  { id:'u3', name:'Arjun Mehta',    initials:'AM', phone:'9100000003', pin:hashPin('1234'), platform:'Zepto',   location:'Bangalore', zone:'Koramangala',     gtsScore:481, gtsTier:'low',    status:'flagged', weeklyEarnings:0,    premium:25, lastActive:'1 hr ago',   upi:'arjun@upi',  workHours:'9 AM – 9 PM',   memberSince:'May 2024', activeDeliveryDays:5,  policyNumber:'ISP-2024-0003', policyStart:'2 May 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:500, lowOrders:300, pollution:100, curfew:200} },
  { id:'u4', name:'Deepa Krishnan', initials:'DK', phone:'9100000004', pin:hashPin('1234'), platform:'Swiggy',  location:'Chennai',   zone:'Anna Nagar',      gtsScore:815, gtsTier:'high',   status:'active',  weeklyEarnings:1100, premium:45, lastActive:'5 min ago',  upi:'deepa@upi',  workHours:'10 AM – 10 PM', memberSince:'Feb 2024', activeDeliveryDays:28, policyNumber:'ISP-2024-0004', policyStart:'1 Feb 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:900, lowOrders:600, pollution:200, curfew:300} },
  { id:'u5', name:'Ravi Teja',      initials:'RT', phone:'9100000005', pin:hashPin('1234'), platform:'Amazon',  location:'Hyderabad', zone:'Gachibowli',      gtsScore:558, gtsTier:'medium', status:'active',  weeklyEarnings:580,  premium:30, lastActive:'30 min ago', upi:'ravi@upi',   workHours:'7 AM – 7 PM',   memberSince:'Apr 2024', activeDeliveryDays:18, policyNumber:'ISP-2024-0005', policyStart:'1 Apr 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:600, lowOrders:400, pollution:200, curfew:200} },
  { id:'u6', name:'Sneha Patel',    initials:'SP', phone:'9100000006', pin:hashPin('1234'), platform:'Zomato',  location:'Pune',      zone:'Koregaon Park',   gtsScore:378, gtsTier:'low',    status:'flagged', weeklyEarnings:0,    premium:20, lastActive:'3 hr ago',   upi:'sneha@upi',  workHours:'11 AM – 11 PM', memberSince:'Jun 2024', activeDeliveryDays:4,  policyNumber:'ISP-2024-0006', policyStart:'3 Jun 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:500, lowOrders:300, pollution:100, curfew:100} },
  { id:'u7', name:'Karan Singh',    initials:'KS', phone:'9100000007', pin:hashPin('1234'), platform:'Swiggy',  location:'Delhi',     zone:'Connaught Place', gtsScore:724, gtsTier:'high',   status:'active',  weeklyEarnings:820,  premium:40, lastActive:'8 min ago',  upi:'karan@upi',  workHours:'10 AM – 10 PM', memberSince:'Jan 2024', activeDeliveryDays:19, policyNumber:'ISP-2024-0007', policyStart:'8 Jan 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:400, lowOrders:500, pollution:1000,curfew:400} },
  { id:'u8', name:'Meera Iyer',     initials:'MI', phone:'9100000008', pin:hashPin('1234'), platform:'Zepto',   location:'Bangalore', zone:'Indiranagar',     gtsScore:639, gtsTier:'medium', status:'active',  weeklyEarnings:710,  premium:35, lastActive:'22 min ago', upi:'meera@upi',  workHours:'9 AM – 9 PM',   memberSince:'Mar 2024', activeDeliveryDays:16, policyNumber:'ISP-2024-0008', policyStart:'5 Mar 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:700, lowOrders:500, pollution:100, curfew:200} },
];

const SEED_PAYOUTS = [
  { id:'ap1', workerId:'u1', workerName:'Rahul Sharma',   platform:'Swiggy', amount:300, type:'rain',      reason:'Rain',       date:'Today',      time:'11:42 AM', auto:true,  status:'paid' },
  { id:'ap2', workerId:'u4', workerName:'Deepa Krishnan', platform:'Swiggy', amount:250, type:'rain',      reason:'Rain',       date:'Today',      time:'11:40 AM', auto:true,  status:'paid' },
  { id:'ap3', workerId:'u7', workerName:'Karan Singh',    platform:'Swiggy', amount:250, type:'rain',      reason:'Rain',       date:'Today',      time:'11:38 AM', auto:true,  status:'paid' },
  { id:'ap4', workerId:'u1', workerName:'Rahul Sharma',   platform:'Swiggy', amount:200, type:'lowOrders', reason:'Low Orders', date:'Yesterday',  time:'9:05 PM',  auto:false, status:'paid' },
  { id:'ap5', workerId:'u2', workerName:'Priya Nair',     platform:'Zomato', amount:200, type:'lowOrders', reason:'Low Orders', date:'Yesterday',  time:'8:30 PM',  auto:false, status:'paid' },
  { id:'ap6', workerId:'u8', workerName:'Meera Iyer',     platform:'Zepto',  amount:180, type:'lowOrders', reason:'Low Orders', date:'Yesterday',  time:'7:55 PM',  auto:false, status:'paid' },
  { id:'ap7', workerId:'u5', workerName:'Ravi Teja',      platform:'Amazon', amount:150, type:'lowOrders', reason:'Low Orders', date:'Mon 14 Jan', time:'6:20 PM',  auto:true,  status:'paid' },
  { id:'ap8', workerId:'u3', workerName:'Arjun Mehta',    platform:'Zepto',  amount:300, type:'rain',      reason:'Rain',       date:'Mon 14 Jan', time:'2:10 PM',  auto:false, status:'held' },
  { id:'ap9', workerId:'u6', workerName:'Sneha Patel',    platform:'Zomato', amount:200, type:'lowOrders', reason:'Low Orders', date:'Sun 13 Jan', time:'5:45 PM',  auto:false, status:'held' },
];

const SEED_FRAUD = [
  { id:'f1', workerId:'u3', workerName:'Arjun Mehta', platform:'Zepto',  location:'Bangalore', reason:'GPS spoofing detected', detail:'Static coordinates for 47 min during claimed active delivery', confidence:87, date:'Today',     gtsScore:481, status:'open' },
  { id:'f2', workerId:'u6', workerName:'Sneha Patel', platform:'Zomato', location:'Pune',      reason:'Claim pattern anomaly', detail:'4 low-order claims in 6 days — 3× peer average for this zone',  confidence:72, date:'Yesterday', gtsScore:378, status:'open' },
];

const SEED_ADMIN_ALERTS = [
  { id:'aa1', type:'rain',      zone:'Velachery, Chennai',     severity:'high',   message:'Heavy rainfall — 14 workers affected, auto-payouts triggered', time:'11:40 AM',   active:true  },
  { id:'aa2', type:'lowOrders', zone:'Andheri West, Mumbai',   severity:'medium', message:'Demand drop >50% detected — 3 workers pending verification',   time:'9:00 PM',    active:true  },
  { id:'aa3', type:'curfew',    zone:'Koramangala, Bangalore', severity:'low',    message:'Zone restriction lifted — coverage resumed normally',           time:'Mon 14 Jan', active:false },
];

const SEED_WORKER_ALERTS = [
  { id:'wa1', workerId:'u1', type:'rain', title:'Rain today', message:"Orders may slow. You're fully covered.", badge:'AUTO ON' },
];

const SEED_ADMIN_SETTINGS = {
  key: 'singleton',
  triggers: {
    rain:      { enabled:true,  autoPay:true,  payoutAmount:300, label:'Rain'            },
    lowOrders: { enabled:true,  autoPay:false, payoutAmount:200, label:'Low Orders'      },
    curfew:    { enabled:true,  autoPay:true,  payoutAmount:250, label:'Curfew'          },
    outage:    { enabled:false, autoPay:false, payoutAmount:150, label:'Platform Outage' },
  },
  gigtrust: { highMin:700, mediumMin:500 },
  premium:  { minPremium:20, maxPremium:50, coverageDivisor:1800 },
  platform: { active:true, maintenanceMode:false, fraudAutoSuspend:true },
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Worker.deleteMany({}),
    Payout.deleteMany({}),
    FraudFlag.deleteMany({}),
    AdminAlert.deleteMany({}),
    WorkerAlert.deleteMany({}),
    AdminSettings.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Insert seed data
  await Worker.insertMany(SEED_WORKERS);
  await Payout.insertMany(SEED_PAYOUTS);
  await FraudFlag.insertMany(SEED_FRAUD);
  await AdminAlert.insertMany(SEED_ADMIN_ALERTS);
  await WorkerAlert.insertMany(SEED_WORKER_ALERTS);
  await AdminSettings.create(SEED_ADMIN_SETTINGS);

  console.log('✅ Seed complete!');
  console.log(`   ${SEED_WORKERS.length} workers`);
  console.log(`   ${SEED_PAYOUTS.length} payouts`);
  console.log(`   ${SEED_FRAUD.length} fraud flags`);
  console.log(`   ${SEED_ADMIN_ALERTS.length} admin alerts`);
  console.log('\n   Demo login: phone 9100000001, PIN 1234 (Rahul Sharma)');
  console.log('   Admin login: admin@instasure.com / Admin@123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
