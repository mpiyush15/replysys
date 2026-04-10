/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('pixelswhatsapp');

// Create a new document in the collection.
db.getCollection('phonenumbers').insertOne({
  accountId: '2600001',
  workspaceId: null,
  phoneNumberId: '999739519890361',
  wabaId: '888226804488599',
  accessToken: 'bdb8f09bc6f807b0195357100c580c2e:417ec343da8a1c5781a415086dc11c7751c91a1247e5c233144caf29f4f1c12c4db77cf601c797e906699161c77621af87e4ad661c1f43fe4eec859e665ecd786d95881351f6f738f2b7b32d6f130dfacf1e372e38b88e724a6186acd8b8e62119cc39be5dcd71af9b3fff89877216be29fbc23244228f10463b82d235ce6c89bf21978d1b93852b2f4b036f95ffebeca29dd47908f78f36c26822b6a6890dffbb66bb7de47748bfe6adce592a2ccba9853657c49109a2ff20a683ceac38111447aa65f9f941eb8a0f9732689a6417d9673146606889f0cb0a3f3de0bc3fad60d13ba6909af912006d8aa98de813abf5fedd6b757f52efbd5fcc7b35a68e0e07faaea9012dbbba3aaf1add6f64e7d7b98cf9677ae015ac2ecfd1f3b15d865ba51ea45c919fbdb2bb1d055057ae80c18e4cff6ff0cca2864564cb794cf038cb25a42fd167e5e5a725674cfd0f63356773',
  displayName: 'WhatsApp Business',
  displayPhone: '+91 80871 31777',
  isActive: true,
  verifiedAt: ISODate('2026-03-07T08:13:29.107Z'),
  messageCount: {
    total: NumberInt('42'),
    sent: NumberInt('42'),
    delivered: NumberInt('32'),
    read: NumberInt('29'),
    failed: NumberInt('8')
  },
  qualityRating: 'green',
  tokenUpdatedAt: ISODate('2026-03-07T08:13:29.139Z'),
  createdAt: ISODate('2026-03-07T08:13:29.140Z'),
  updatedAt: ISODate('2026-03-24T07:10:20.652Z'),
  __v: NumberInt('0'),
  lastTestedAt: ISODate('2026-03-13T11:00:08.317Z'),
  isConnected: true,
  phone: '+918087131777',
  status: 'Active',
  syncedAt: ISODate('2026-03-13T11:02:36.703Z')
});
