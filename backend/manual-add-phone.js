const mongoose = require('mongoose');
require('dotenv').config();

async function manuallyAddPhone() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
    
    // Define schemas
    const userSchema = new mongoose.Schema({}, { strict: false });
    const accountSchema = new mongoose.Schema({}, { strict: false });
    const phoneSchema = new mongoose.Schema({}, { strict: false });
    
    const User = mongoose.model('User', userSchema, 'users');
    const Account = mongoose.model('Account', accountSchema, 'accounts');
    const PhoneNumber = mongoose.model('PhoneNumber', phoneSchema, 'phonenumbers');
    
    // Find user
    console.log('🔍 Finding support@replysys.com user...');
    const user = await User.findOne({ email: 'support@replysys.com' });
    
    if (!user) {
      console.log('❌ User not found');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('✅ Found user:', user._id);
    
    // Find or create account
    console.log('\n📝 Finding/Creating Account...');
    let account = await Account.findOne({ accountId: String(user._id) });
    
    if (!account) {
      console.log('   Creating new Account...');
      account = new Account({
        accountId: String(user._id),
        userId: user._id,
        wabaId: 'MANUAL_SETUP',
        metaSync: {
          status: 'authorized',
          accountId: String(user._id),
          oauth_timestamp: new Date(),
          note: 'Manually added phone number'
        },
        status: 'active'
      });
      await account.save();
      console.log('✅ Account created:', account._id);
    } else {
      console.log('✅ Account exists:', account._id);
    }
    
    // Check if phone already exists
    console.log('\n📱 Checking for existing phone...');
    let existingPhone = await PhoneNumber.findOne({
      accountId: String(user._id),
      phoneNumberId: '999739519890361'
    });
    
    if (existingPhone) {
      console.log('⚠️  Phone already exists in account');
      console.log('   ID:', existingPhone._id);
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create phone number record
    console.log('\n➕ Creating phone number record...');
    const phoneNumber = new PhoneNumber({
      accountId: String(user._id),
      phoneNumberId: '999739519890361',
      wabaId: 'MANUAL_SETUP',
      displayPhoneNumber: '+91 80871 31777',
      displayName: 'Enromatics',
      qualityRating: 'GREEN',
      verifiedName: 'Enromatics',
      verificationStatus: 'EXPIRED',
      isVerified: true,
      verifiedAt: new Date('2026-03-07T08:13:22+0000'),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await phoneNumber.save();
    
    console.log('✅ Phone number created successfully!\n');
    console.log('Details:');
    console.log('  Phone ID:', phoneNumber._id);
    console.log('  Number:', phoneNumber.displayPhoneNumber);
    console.log('  Quality Rating:', phoneNumber.qualityRating);
    console.log('  Account:', phoneNumber.accountId);
    console.log('  Status:', phoneNumber.status);
    
    // Update account with WABA ID if not set
    if (account.wabaId === 'MANUAL_SETUP' || !account.wabaId) {
      console.log('\n📝 Updating Account with WABA ID...');
      // For manual setup, we need a real WABA ID from Meta
      // For now, we can keep MANUAL_SETUP as placeholder
      console.log('   Note: Real WABA ID will come from webhook or manual entry');
    }
    
    console.log('\n✅ PHONE MANUALLY ADDED TO ACCOUNT!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh settings page');
    console.log('   2. Should see: +91 80871 31777 (GREEN)');
    console.log('   3. If webhook arrives, it will update with real WABA ID\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

manuallyAddPhone();
