const mongoose = require('mongoose');
require('dotenv').config();

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available Collections:', collections.map(c => c.name).join(', '));
    console.log('\n' + '='.repeat(80) + '\n');

    // Check Users
    console.log('👤 USERS COLLECTION:');
    const users = await db.collection('users').find({}).toArray();
    console.log(`Count: ${users.length}`);
    users.forEach(u => {
      console.log(`  _id: ${u._id}`);
      console.log(`  email: ${u.email}`);
      console.log(`  name: ${u.name}`);
      console.log(`  role: ${u.role}`);
      console.log(`  clientId: ${u.clientId}`);
      console.log(`  accountId: ${u.accountId}`);
      console.log();
    });

    console.log('='.repeat(80) + '\n');

    // Check Accounts
    console.log('🏢 ACCOUNTS COLLECTION:');
    const accounts = await db.collection('accounts').find({}).toArray();
    console.log(`Count: ${accounts.length}`);
    accounts.forEach(a => {
      console.log(`  _id: ${a._id}`);
      console.log(`  accountId (field): ${a.accountId}`);
      console.log(`  userId: ${a.userId}`);
      console.log(`  wabaId: ${a.wabaId}`);
      console.log(`  metaSync.status: ${a.metaSync?.status}`);
      console.log();
    });

    console.log('='.repeat(80) + '\n');

    // Check PhoneNumbers
    console.log('📱 PHONENUMBERS COLLECTION:');
    const phones = await db.collection('phonenumbers').find({}).toArray();
    console.log(`Count: ${phones.length}`);
    phones.forEach(p => {
      console.log(`  _id: ${p._id}`);
      console.log(`  accountId (saved with): ${p.accountId}`);
      console.log(`  phoneNumberId: ${p.phoneNumberId}`);
      console.log(`  wabaId: ${p.wabaId}`);
      console.log(`  displayPhoneNumber: ${p.displayPhoneNumber}`);
      console.log(`  status: ${p.status}`);
      console.log();
    });

    console.log('='.repeat(80) + '\n');

    // Cross-reference check
    console.log('🔍 CROSS-REFERENCE CHECK:\n');
    
    if (accounts.length > 0 && phones.length > 0) {
      const account = accounts[0];
      const phone = phones[0];
      
      console.log(`Account._id: ${account._id}`);
      console.log(`Account.accountId (field): ${account.accountId}`);
      console.log(`Phone.accountId (saved): ${phone.accountId}\n`);
      
      const idMatch = String(account._id) === phone.accountId;
      const fieldMatch = account.accountId === phone.accountId;
      
      console.log(`✅ Match with Account._id: ${idMatch ? 'YES ✓' : 'NO ✗'}`);
      console.log(`✅ Match with Account.accountId field: ${fieldMatch ? 'YES ✓' : 'NO ✗'}\n`);
      
      if (!idMatch && !fieldMatch) {
        console.log('❌ PROBLEM: Phone accountId matches NEITHER Account._id NOR Account.accountId field!');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debug();
