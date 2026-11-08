import sqlite3
import os

dbs = ['rallyvision.db', 'backend/rallyvision.db']
for db_path in dbs:
    if not os.path.exists(db_path):
        continue
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    match_cols = [r[1] for r in cur.execute('PRAGMA table_info(matches)').fetchall()]
    if 'is_public_shared' not in match_cols:
        cur.execute('ALTER TABLE matches ADD COLUMN is_public_shared BOOLEAN DEFAULT 0')
        print(f'Added is_public_shared to matches in {db_path}')
    if 'share_token' not in match_cols:
        cur.execute('ALTER TABLE matches ADD COLUMN share_token VARCHAR(64)')
        print(f'Added share_token to matches in {db_path}')

    conn.commit()
    conn.close()
    print(f'Verified {db_path}')

