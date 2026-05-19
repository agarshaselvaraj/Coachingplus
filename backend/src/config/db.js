const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Self-healing database initialization function
async function initDb() {
  const client = await pool.connect();
  try {
    console.log('Initializing PostgreSQL database...');
    
    // Create the coaching feeds table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS feeds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        coach_name VARCHAR(100) NOT NULL,
        coach_avatar VARCHAR(255) DEFAULT '',
        category VARCHAR(50) NOT NULL,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if table is empty, if so, seed it with premium content
    const res = await client.query('SELECT COUNT(*) FROM feeds');
    const count = parseInt(res.rows[0].count, 10);
    
    if (count === 0) {
      console.log('Feeds table is empty. Seeding mock coaching data...');
      const seedQuery = `
        INSERT INTO feeds (title, content, coach_name, coach_avatar, category, likes_count)
        VALUES 
        (
          'The Obstacle is the Way', 
          'The impediment to action advances action. What stands in the way becomes the way. Remember that every challenge is a unique opportunity to practice virtue, build mental toughness, and refine your character. Refocus your energy entirely on what is within your control, and let go of what isn''t.', 
          'Coach Marcus Aurelius', 
          'https://api.dicebear.com/7.x/initials/svg?seed=MA&backgroundColor=6366f1&fontSize=42&fontWeight=600', 
          'Mindset', 
          42
        ),
        (
          'Mastering the Infinite Game', 
          'In business and life, there is no such thing as "winning" an infinite game. The objective is simply to keep playing, to continue refining your systems, and to build sustainable long-term value. Focus on cultivating a culture of trust and continuous learning rather than chasing short-term victories.', 
          'Coach Elena Rostova', 
          'https://api.dicebear.com/7.x/initials/svg?seed=ER&backgroundColor=0ea5e9&fontSize=42&fontWeight=600', 
          'Strategy', 
          29
        ),
        (
          'Embracing the Daily Grind', 
          'You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential. Don''t stop when you are tired; stop only when you are done. The daily discipline of pushing through physical and mental resistance is where your real strength is forged.', 
          'Coach David Goggins', 
          'https://api.dicebear.com/7.x/initials/svg?seed=DG&backgroundColor=10b981&fontSize=42&fontWeight=600', 
          'Fitness', 
          56
        ),
        (
          'Compounding Marginal Gains', 
          'If you can get 1% better each day for one year, you''ll end up thirty-seven times better by the time you''re done. Success is not a single, dramatic transformation; it is the compound interest of self-improvement. Excellence is a daily habit, not an isolated event.', 
          'Coach James Clear', 
          'https://api.dicebear.com/7.x/initials/svg?seed=JC&backgroundColor=f59e0b&fontSize=42&fontWeight=600', 
          'Business', 
          38
        );
      `;
      await client.query(seedQuery);
      console.log('Database seeded successfully!');
    } else {
      console.log(`Database already populated with ${count} records.`);
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDb,
  query: (text, params) => pool.query(text, params),
};
