import sqlite3
import os

dbs = ['rallyvision.db', 'backend/rallyvision.db']
for db_path in dbs:
    if not os.path.exists(db_path):
        continue
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check users table
    user_cols = [r[1] for r in cur.execute('PRAGMA table_info(users)').fetchall()]
    if 'last_login_at' not in user_cols:
        cur.execute('ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP')
        print(f'Added last_login_at to users in {db_path}')

    # Check user_profiles table
    prof_cols = [r[1] for r in cur.execute('PRAGMA table_info(user_profiles)').fetchall()]
    if 'is_profile_private' not in prof_cols:
        cur.execute('ALTER TABLE user_profiles ADD COLUMN is_profile_private BOOLEAN DEFAULT 1')
        print(f'Added is_profile_private to user_profiles in {db_path}')
    if 'share_anonymous_telemetry' not in prof_cols:
        cur.execute('ALTER TABLE user_profiles ADD COLUMN share_anonymous_telemetry BOOLEAN DEFAULT 0')
        print(f'Added share_anonymous_telemetry to user_profiles in {db_path}')
    if 'allow_ai_model_training' not in prof_cols:
        cur.execute('ALTER TABLE user_profiles ADD COLUMN allow_ai_model_training BOOLEAN DEFAULT 0')
        print(f'Added allow_ai_model_training to user_profiles in {db_path}')
    if 'video_retention_days' not in prof_cols:
        cur.execute('ALTER TABLE user_profiles ADD COLUMN video_retention_days INTEGER DEFAULT 90')
        print(f'Added video_retention_days to user_profiles in {db_path}')
    if 'data_encryption_standard' not in prof_cols:
        cur.execute("ALTER TABLE user_profiles ADD COLUMN data_encryption_standard VARCHAR(50) DEFAULT 'AES-256-GCM'")
        print(f'Added data_encryption_standard to user_profiles in {db_path}')
    if 'two_factor_enabled' not in prof_cols:
        cur.execute('ALTER TABLE user_profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0')
        print(f'Added two_factor_enabled to user_profiles in {db_path}')

    conn.commit()
    conn.close()
    print(f'Migration verified for {db_path}')

