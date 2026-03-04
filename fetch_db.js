const { Client } = require('pg');
const fs = require('fs');

async function main() {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        const env = fs.readFileSync('.env.local', 'utf8');
        const match = env.match(/DATABASE_URL="?([^"\n]+)"?/);
        if (match) dbUrl = match[1];
    }
    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();
        console.log('Connected to DB');
        const res = await client.query(`SELECT "result" FROM "SearchJob" WHERE "status" = 'COMPLETED' AND "result" IS NOT NULL ORDER BY "updatedAt" DESC LIMIT 1`);
        if (res.rows.length > 0) {
            const resultList = res.rows[0].result;
            if (resultList && resultList.length > 0) {
                fs.writeFileSync('pc_item_sample.json', JSON.stringify(resultList[0], null, 2));
                console.log('Saved to pc_item_sample.json');
            } else {
                console.log('Result array is empty');
            }
        } else {
            console.log('No completed job found');
        }
    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await client.end();
    }
}
main();
