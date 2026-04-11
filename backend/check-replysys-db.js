const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas matching the actual database
const AccountSchema = new mongoose.Schema({}, { collection: 'accounts', strict: false });
const PhoneNumberSchema = new mongoose.Schema({}, { collection: 'phonenumbers', strict: false });

const Account = mongoose.model('Account', AccountSchema);
const PhoneNumber = mongoose.model('PhoneNumber', PhoneNumberSchema);

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to replysys database\n');

    // Get all accounts
    console.log('========== ACCOUNTS COLLECTION ==========\n');
    const accounts = await Account.find({}).lean();
    console.log(`Total Accounts: ${accounts.length}\n`);
    
    accounts.forEach((acc, idx) => {
      console.log(`Account ${idx + 1}:`);
      console.log(`  _id: ${acc._id}`);
      console.log(`  accountId (field): ${acc.accountId}`);
      console.log(`  userId: ${acc.userId}`);
      console.log(`  wabaId: ${acc.wabaId}`);
      console.log(`  status: ${acc.status}`);
      console.log(`  metaSync: ${JSON.stringify(acc.metaSync)}`);
      console.log('');
    });

    // Get all phone numbers
    console.log('\n========== PHONENUMBERS COLLECTION ==========\n');
    const phones = await PhoneNumber.find({}).lean();
    console.log(`Total Phone Numbers: ${phones.length}\n`);
    
    phones.forEach((phone, idx) => {
      console.log(`Phone ${idx + 1}:`);
      console.log(`  _id: ${phone._id}`);
      console.log(`  accountId (stored): ${phone.accountId}`);
      console.log(`  phoneNumberId: ${phone.phoneNumberId}`);
      console.log(`  displayPhoneNumber: ${phone.displayPhoneNumber}`);
      console.log(`  wabaId: ${phone.wabaId}`);
      console.log(`  status: ${phone.status}`);
      console.log('');
    });

    // Check if accountIds match
    console.log('\n========== CONSISTENCY CHECK ==========\n');
    
    for (let account of accounts) {
      console.log(`Account _id: ${account._id}`);
      console.log(`Account.accountId field: ${account.accountId}`);
      
      const phonesForAccount = phones.filter(p => String(p.accountId) === String(account._id));
      const phonesForAccountField = phones.filter(p => String(p.accountId) === String(account.accountId));
      
      console.log(`  Phones with accountId = Account._id: ${phonesForAccount.length}`);
      console.log(`  Phones with accountId = Account.accountId field: ${phonesForAccountField.length}`);
      console.log('');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDB();
