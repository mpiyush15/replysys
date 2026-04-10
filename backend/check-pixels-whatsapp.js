const mongoose = require('mongoose');
require('dotenv').config();

async function findPhoneOwner() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    console.log('\n🔍 Searching for phone number in pixels-whatsapp collection...\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('pixels-whatsapp');
    
    // Search by phone ID or phone number
    const phoneId = '999739519890361';
    const phoneNumber = '+91 80871 31777';
    
    // Try to find by phone ID
    let result = await collection.findOne({ phoneNumberId: phoneId });
    
    if (!result) {
      // Try to find by display phone number
      result = await collection.findOne({ displayPhoneNumber: phoneNumber });
    }
    
    if (!result) {
      // Try to find by phone field
      result = await collection.findOne({ 'phone': phoneNumber });
    }
    
    if (!result) {
      console.log('❌ Phone number not found in pixels-whatsapp collection');
      
      // List first 5 records to see structure
      console.log('\n📋 Sample records in collection:');
      const samples = await collection.find({}).limit(5).toArray();
      if (samples.length === 0) {
        console.log('   Collection is empty');
      } else {
        samples.forEach((doc, i) => {
          console.log(`\n${i+1}. ID: ${doc._id}`);
          console.log(`   Phone: ${doc.displayPhoneNumber || doc.phone || doc.phoneNumberId || 'N/A'}`);
          console.log(`   Account: ${doc.accountId || doc.account_id || 'N/A'}`);
          console.log(`   WABA: ${doc.wabaId || doc.waba_id || 'N/A'}`);
        });
      }
      
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log('✅ FOUND PHONE NUMBER in pixels-whatsapp:\n');
    console.log('Phone Details:');
    console.log('  ID:', result._id);
    console.log('  Phone Number:', result.displayPhoneNumber || result.phone);
    console.log('  Phone ID:', result.phoneNumberId || 'N/A');
    console.log('  Account ID:', result.accountId || result.account_id || 'N/A');
    console.log('  WABA ID:', result.wabaId || result.waba_id || 'N/A');
    console.log('  Status:', result.status || 'N/A');
    console.log('  Quality Rating:', result.qualityRating || result.quality_rating || 'N/A');
    console.log('  Created:', result.createdAt || result.created_at || 'N/A');
    console.log('  Updated:', result.updatedAt || result.updated_at || 'N/A');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findPhoneOwner();
