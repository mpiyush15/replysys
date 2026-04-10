const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

const accountSchema = new mongoose.Schema({}, { strict: false });
const Account = mongoose.model('Account', accountSchema, 'accounts');

async function disconnectWABA() {
  try {
    console.log('\n⚠️  DISCONNECTING WABA...\n');
    
    // Find account
    const account = await Account.findOne({ email: 'support@replysys.com' });
    
    if (!account) {
      console.log('❌ Account not found');
      process.exit(1);
    }
    
    if (!account.wabaId) {
      console.log('❌ No WABA ID to disconnect');
      process.exit(1);
    }
    
    const token = account.metaSync?.oauthAccessToken || account.accessToken;
    
    if (!token) {
      console.log('❌ No access token found');
      process.exit(1);
    }
    
    console.log('WABA ID:', account.wabaId);
    console.log('Deleting from Meta...\n');
    
    // Delete app assignment (disconnect)
    try {
      // First try to revoke the app subscription
      await axios.delete(
        `https://graph.facebook.com/v21.0/${account.wabaId}/app`,
        {
          params: {
            access_token: token
          }
        }
      );
      console.log('✅ App revoked from WABA');
    } catch (revokeError) {
      console.log('⚠️  Could not revoke app (might already be revoked)');
      console.log('   Error:', revokeError.response?.data?.error?.message || revokeError.message);
    }
    
    // Clear from database
    console.log('\n🗑️  Clearing from database...');
    
    await Account.findByIdAndUpdate(
      account._id,
      {
        wabaId: null,
        businessId: null,
        accessToken: null,
        metaSync: {
          status: 'pending',
          accountId: account.accountId,
          note: 'Disconnected at ' + new Date().toISOString()
        },
        status: 'pending'
      }
    );
    
    console.log('✅ Database cleared');
    
    // Delete phone numbers
    const PhoneNumberSchema = new mongoose.Schema({}, { strict: false });
    const PhoneNumber = mongoose.model('PhoneNumber', PhoneNumberSchema, 'phonenumbers');
    
    const deleteResult = await PhoneNumber.deleteMany({ accountId: String(account.accountId) });
    console.log(`✅ Deleted ${deleteResult.deletedCount} phone number(s)`);
    
    console.log('\n✅ WABA DISCONNECTED');
    console.log('\n🔄 Next steps:');
    console.log('   1. Go to settings');
    console.log('   2. Click "Connect WhatsApp"');
    console.log('   3. Complete OAuth flow again\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

disconnectWABA();
