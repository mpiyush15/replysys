const mongoose = require('mongoose');
require('dotenv').config();

const PhoneNumberSchema = new mongoose.Schema({
  accountId: String,
  phoneNumberId: String,
  wabaId: String,
  displayPhoneNumber: String,
  status: String
}, { collection: 'phonenumbers' });

const AccountSchema = new mongoose.Schema({
  accountId: String,
  userId: String,
  wabaId: String
}, { collection: 'accounts' });

const PhoneNumber = mongoose.model('PhoneNumber', PhoneNumberSchema);
const Account = mongoose.model('Account', AccountSchema);

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📱 All Phone Numbers:');
    const phones = await PhoneNumber.find({}).lean();
    console.log(JSON.stringify(phones, null, 2));

    console.log('\n📊 All Accounts:');
    const accounts = await Account.find({}).lean();
    console.log(JSON.stringify(accounts, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debug();
