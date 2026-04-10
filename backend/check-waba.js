const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

const accountSchema = new mongoose.Schema({}, { strict: false });
const Account = mongoose.model('Account', accountSchema, 'accounts');

async function checkWABA() {
  try {
    console.log('\n🔍 Checking WABA connection status...\n');
    
    // Find account by email
    const account = await Account.findOne({ email: 'support@replysys.com' });
    
    if (!account) {
      console.log('❌ Account not found for support@replysys.com');
      process.exit(1);
    }
    
    console.log('✅ Found Account:');
    console.log('  ID:', account._id);
    console.log('  WABA ID:', account.wabaId || '❌ NOT SET');
    console.log('  Status:', account.status);
    
    // Check for OAuth token
    const token = account.metaSync?.oauthAccessToken || account.accessToken;
    
    if (!token) {
      console.log('❌ No access token found');
      process.exit(1);
    }
    
    console.log('  Token: ✅ STORED\n');
    
    if (!account.wabaId) {
      console.log('⏳ No WABA ID yet - still awaiting webhook');
      console.log('\nDo OAuth verification again to get WABA ID\n');
      process.exit(0);
    }
    
    // Check WABA connection via Graph API
    console.log('📊 Checking WABA status on Meta Graph API...\n');
    
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${account.wabaId}`,
        {
          params: {
            fields: 'id,name,currency,timezone,status,business_id,owner_business_id,phone_number_id,on_behalf_of_business_account_id',
            access_token: token
          }
        }
      );
      
      console.log('✅ WABA IS CONNECTED on Meta API');
      console.log('\nWABA Details:');
      console.log('  ID:', response.data.id);
      console.log('  Name:', response.data.name || 'N/A');
      console.log('  Status:', response.data.status || 'N/A');
      console.log('  Timezone:', response.data.timezone || 'N/A');
      console.log('  Currency:', response.data.currency || 'N/A');
      console.log('  Business ID:', response.data.business_id || 'N/A');
      
      // Check phone numbers
      console.log('\n📱 Checking phone numbers...');
      const phoneResponse = await axios.get(
        `https://graph.facebook.com/v21.0/${account.wabaId}/phone_numbers`,
        {
          params: {
            fields: 'id,phone_number,display_phone_number,quality_rating,name_status',
            access_token: token
          }
        }
      );
      
      const phones = phoneResponse.data?.data || [];
      console.log(`  Found ${phones.length} phone number(s)`);
      phones.forEach((p, i) => {
        console.log(`    ${i+1}. ${p.display_phone_number || p.id} (Rating: ${p.quality_rating || 'N/A'})`);
      });
      
    } catch (metaError) {
      if (metaError.response?.status === 400 || metaError.response?.status === 401) {
        console.log('❌ WABA NOT CONNECTED or Token Invalid');
        console.log('   Error:', metaError.response?.data?.error?.message || metaError.message);
        console.log('\n🔄 Need to do OAuth verification again\n');
      } else {
        console.error('❌ Error checking WABA:', metaError.message);
      }
    }
    
    // Option to disconnect
    console.log('\n📝 Options:');
    console.log('   1. To disconnect WABA: node disconnect-waba.js');
    console.log('   2. To do OAuth again: Go to settings and click "Connect WhatsApp"\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkWABA();
