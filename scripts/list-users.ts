// Script to list users
import 'dotenv/config';
import { db, users } from '../src/lib/db';

async function listUsers() {
    const allUsers = await db.select({ email: users.email, name: users.name, role: users.role }).from(users);
    console.log('Users in database:');
    allUsers.forEach(u => console.log(`- ${u.email} (${u.name}) - ${u.role}`));
    process.exit(0);
}

listUsers().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
