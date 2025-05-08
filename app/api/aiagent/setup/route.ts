import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 管理者権限が必要

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // テーブルが存在するか確認
    const { data: existingTables, error: checkError } = await supabase
      .from('visa_types')
      .select('id')
      .limit(1);

    if (!checkError) {
      // テーブルが既に存在する場合
      return NextResponse.json({
        success: true,
        message: 'AIエージェント用のテーブルは既に存在します',
        tables: existingTables
      });
    }

    // テーブルが存在しない場合、Supabaseダッシュボードでの手動作成を促す
    return NextResponse.json({
      success: false,
      message: 'テーブルが存在しません。Supabaseダッシュボードで以下のSQLを実行してください。',
      sql: `
-- AIエージェント用のテーブルを作成

-- pg_trgm拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ビザ情報テーブル
CREATE TABLE IF NOT EXISTS visa_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visa_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visa_type_id UUID REFERENCES visa_types(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  process TEXT,
  official_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- チャットセッションテーブル
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  status TEXT CHECK (status IN ('unread', 'active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions (user_id);

-- サンプルデータの挿入
INSERT INTO visa_types (name, slug, description) VALUES
('学生ビザ', 'study-permit', 'カナダの教育機関で6ヶ月以上の学習を行うための許可証'),
('ワーキングホリデービザ', 'working-holiday', '18歳から30歳までの若者がカナダで最長12ヶ月間働きながら滞在できるビザ'),
('就労ビザ', 'work-permit', 'カナダで就労するための許可証'),
('永住権', 'permanent-residence', 'カナダに永住するための資格')
ON CONFLICT (slug) DO NOTHING;

-- 学生ビザの情報
INSERT INTO visa_information (visa_type_id, title, description, requirements, process, official_url) VALUES
(
  (SELECT id FROM visa_types WHERE slug = 'study-permit'),
  'カナダ学生ビザ（Study Permit）',
  'カナダの教育機関で6ヶ月以上の学習を行うために必要な許可証です。',
  '1. カナダの教育機関からの入学許可証（Letter of Acceptance）
2. 十分な資金証明（学費と生活費をカバーできる額）
3. 犯罪経歴証明書
4. 健康診断の結果
5. パスポート（有効期限が十分にあるもの）',
  '1. オンラインまたは紙の申請書を提出
2. 申請料の支払い（約150カナダドル）
3. 生体認証情報の提供（指紋と写真）
4. 必要に応じて面接
5. 審査結果の待機（通常4〜8週間）',
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html'
)
ON CONFLICT DO NOTHING;

-- ワーキングホリデービザの情報
INSERT INTO visa_information (visa_type_id, title, description, requirements, process, official_url) VALUES
(
  (SELECT id FROM visa_types WHERE slug = 'working-holiday'),
  'ワーキングホリデービザ（IEC Working Holiday）',
  '日本とカナダの協定に基づき、18歳から30歳までの若者がカナダで最長12ヶ月間働きながら滞在できるビザです。',
  '1. 18歳から30歳までの日本国籍保持者
2. 有効なパスポート
3. 最低2,500カナダドルの資金証明
4. 帰国のための航空券または購入できる資金
5. 健康保険
6. 犯罪経歴がないこと',
  '1. IRCC（カナダ移民局）のウェブサイトでプロフィール作成
2. 招待状（ITA）を受け取る
3. 申請書類の提出と申請料の支払い（約250カナダドル）
4. 生体認証情報の提供
5. 審査結果の待機（通常8週間程度）',
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html'
)
ON CONFLICT DO NOTHING;
      `
    });
  } catch (error: any) {
    console.error('Setup API error:', error);
    return NextResponse.json(
      { error: 'セットアップ中にエラーが発生しました', details: error.message },
      { status: 500 }
    );
  }
} 