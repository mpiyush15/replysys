const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const accountSchema = new mongoose.Schema({}, { strict: false });
const Account = mongoose.model('Account', accountSchema, 'accounts');

async function findUser() {
  try {
    console.log('\n🔍 Searching for support@replysys.com user...');
    
    const account = await Account.findOne({ email: 'support@replysys.com' });
    
    if (!account) {
      console.log('❌ User not found with that email');
      console.log('\nTrying ID: 69d8c92852013d44eab38db6');
      const byId = await Account.findById('69d8c92852013d44eab38db6');
      if (!byId) {
        console.log('❌ Also not found by ID');
        
        // List all accounts
        console.log('\n📋 All accounts in database:');
        const all = await Account.find({}).limit(5);
        all.forEach(a => {
          console.log(`  - ${a.email} (ID: ${a._id})`);
        });
      }
      process.exit(1);
    }
    
    console.log('\n✅ Found account:');
    console.log('  Email:', account.email);
    console.log('  ID:', account._id);
    console.log('  WABA ID:', account.wabaId || '❌ NOT SET');
    console.log('  OAuth Status:', account.metaSync?.oauth_status || 'NOT SET');
    console.log('  AccessToken Stored:', account.metaSync?.oauthAccessToken ? '✅ YES' : '❌ NO');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findUser();
