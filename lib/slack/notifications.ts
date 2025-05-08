/**
 * Slack通知機能
 * 管理者向けに以下のイベントを通知します:
 * - ユーザーが追加されたとき
 * - 新規チャットが届いたとき
 * - 新規のコース申請があったとき
 * - 新規のビザ相談があったとき
 */

// エラーハンドリング用のカスタムエラークラス
export class SlackNotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackNotificationError";
  }
}

/**
 * Slack通知を送信する関数
 * @param title 通知タイトル
 * @param message 通知メッセージ
 * @param fields 追加フィールド
 * @param isTest テストモードかどうか
 * @returns 送信成功したかどうか
 */
export async function sendSlackNotification(
  webhookUrl: string,
  payload: any,
  options: { timeout?: number } = {}
): Promise<{ ok: boolean; error?: string }> {
  if (!webhookUrl) {
    return { ok: false, error: 'webhook_url_missing' };
  }

  const timeout = options.timeout || 10000; // デフォルトは10秒

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let text = '';
      try {
        text = await response.text();
      } catch (textError) {
        // テキスト取得エラーは無視
      }

      return { ok: false, error: `status_${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    // AbortControllerによるタイムアウトの場合
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, error: 'timeout' };
    }
    // その他のfetchエラー
    return { ok: false, error: 'fetch_error' };
  }
}

/**
 * 管理者向けに直接ペイロードを送信する関数
 * @param payload 送信するペイロード
 * @param options オプション
 * @returns 送信結果
 */
export async function sendRawAdminNotification(
  payload: any,
  options: { timeout?: number } = {}
): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = process.env.SLACK_ADMIN_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, error: 'webhook_url_missing' };
  }

  return sendSlackNotification(webhookUrl, payload, options);
}

/**
 * 管理者向けの通知を送信する関数
 * @param title 通知タイトル
 * @param message 通知メッセージ
 * @param fields 追加フィールド
 * @param isTest テストモードかどうか
 * @returns 送信成功したかどうか
 */
export async function sendAdminNotification(
  title: string,
  message: string,
  fields?: { title: string; value: string; short?: boolean }[],
  isTest: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = process.env.SLACK_ADMIN_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, error: 'webhook_url_missing' };
  }

  const payload = {
    attachments: [
      {
        color: '#36a64f',
        title,
        text: message,
        fields: fields || [],
        footer: 'Frog Members Portal',
        footer_icon: 'https://frog.org/favicon.ico',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
  
  if (isTest) {
    return { ok: true };
  }

  try {
    return await sendSlackNotification(webhookUrl, payload);
  } catch (error) {
    return { ok: false, error: 'admin_notification_error' };
  }
}

/**
 * テスト用の通知を送信する
 * @returns 環境変数情報と送信結果
 */
export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':white_check_mark: *Slack通知テスト*\n通知が正常に送信されました。',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*タイムスタンプ*: ${new Date().toISOString()}`,
          },
        },
      ],
    };

    return await sendRawAdminNotification(payload);
  } catch (error) {
    return { ok: false, error: 'test_notification_error' };
  }
}

/**
 * 新規ユーザー登録時の通知
 * @param userId ユーザーID
 * @param email メールアドレス
 * @param name 名前
 * @param profileData プロフィール情報（オプション）
 * @param isTest テストモードかどうか
 */
export async function notifyNewUser(
  userId: string,
  email: string,
  name?: string,
  profileData?: Record<string, any>,
  isTest: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  const displayName = name || email;
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
  
  const messageTitle = '🎉 新規ユーザー登録';
  const messageBody = `${displayName}さんが新規登録しました。`;
  
  const fields = [
    { title: 'ユーザーID', value: userId, short: true },
    { title: 'メールアドレス', value: email, short: true },
  ];
  
  if (name) {
    fields.push({ title: '名前', value: name, short: true });
  }
  
  if (profileData) {
    if (profileData.first_name && profileData.last_name) {
      fields.push({ title: '氏名', value: `${profileData.last_name} ${profileData.first_name}`, short: true });
    }
    
    if (profileData.kana_last_name && profileData.kana_first_name) {
      fields.push({ title: 'フリガナ', value: `${profileData.kana_last_name} ${profileData.kana_first_name}`, short: true });
    }
    
    if (profileData.phone) {
      fields.push({ title: '電話番号', value: profileData.phone, short: true });
    }
    
    if (profileData.current_location) {
      fields.push({ title: '現在地', value: profileData.current_location, short: true });
    }
    
    if (profileData.goal_location) {
      fields.push({ title: '留学希望先', value: profileData.goal_location, short: true });
    }
    
    if (profileData.goal_deadline) {
      fields.push({ title: '留学希望時期', value: profileData.goal_deadline, short: true });
    }
    
    if (profileData.visa_status) {
      fields.push({ title: 'ビザステータス', value: profileData.visa_status, short: true });
    }
  } else {
    fields.push({ 
      title: 'プロフィール', 
      value: 'プロフィール未作成', 
      short: true 
    });
  }
  
  if (appUrl) {
    const userLink = `${appUrl}/admin/users/${userId}`;
    fields.push({ 
      title: '管理画面', 
      value: `<${userLink}|ユーザー詳細を見る>`, 
      short: false 
    });
  }
  
  return sendAdminNotification(messageTitle, messageBody, fields, isTest);
}

/**
 * 新規チャットメッセージの通知
 * @param sessionId セッションID
 * @param userId ユーザーID
 * @param userName ユーザー名
 * @param message メッセージ内容
 * @param isTest テストモードかどうか
 * @returns 送信成功したかどうか
 */
export async function notifyNewChatMessage(
  sessionId: string,
  userId: string,
  userName: string,
  message: string,
  isTest: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  try {
    const webhookUrl = process.env.SLACK_CHAT_WEBHOOK_URL || process.env.SLACK_ADMIN_WEBHOOK_URL;
    if (!webhookUrl) {
      return { ok: false, error: 'webhook_url_missing' };
    }
    
    const isServerSide = typeof window === 'undefined';
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
    const chatLink = appUrl ? `${appUrl}/dashboard/chat/${sessionId}` : null;
    
    const title = '💬 新着メッセージ';
    const messageBody = `${userName}さんから新着メッセージがあります。`;
    
    const fields = [
      { title: 'ユーザー', value: userName, short: true },
      { title: 'ユーザーID', value: userId, short: true },
      { title: 'メッセージ', value: message.length > 100 ? message.substring(0, 97) + '...' : message, short: false },
    ];
    
    if (chatLink) {
      fields.push({ 
        title: 'チャット', 
        value: `<${chatLink}|こちらから返信する>`, 
        short: false 
      });
    }
    
    const startTime = Date.now();
    
    const result = await sendAdminNotification(title, messageBody, fields, isTest);
    
    const processingTime = Date.now() - startTime;
    
    return result;
  } catch (error) {
    return { ok: false, error: 'chat_message_notification_error' };
  }
}

/**
 * 新規コース申請時の通知
 * @param applicationId 申請ID
 * @param userId ユーザーID
 * @param userName ユーザー名
 * @param courseName コース名
 * @param isTest テストモードかどうか
 */
export async function notifyNewCourseApplication(
  applicationId: string,
  userId: string,
  userName: string,
  courseName: string,
  isTest: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
  
  return await sendAdminNotification(
    '新規コース申請',
    `${userName}さんから${courseName}への申し込みがありました`,
    [
      { title: 'ユーザー', value: userName, short: true },
      { title: 'コース', value: courseName, short: true },
      { title: 'リンク', value: `${appUrl}/admin/applications/${applicationId}` },
    ],
    isTest
  );
}

/**
 * 新規ビザ相談時の通知
 * @param reviewId ビザレビューID
 * @param userId ユーザーID
 * @param userName ユーザー名
 * @param visaType ビザタイプ
 * @param isTest テストモードかどうか
 */
export async function notifyNewVisaReview(
  reviewId: string,
  userId: string,
  userName: string,
  visaType: string,
  isTest: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
  
  return await sendAdminNotification(
    '新規ビザ相談',
    `${userName}さんから${visaType}についての相談がありました`,
    [
      { title: 'ユーザー', value: userName, short: true },
      { title: 'ビザタイプ', value: visaType, short: true },
      { title: 'リンク', value: `${appUrl}/admin/visa-reviews/${reviewId}` },
    ],
    isTest
  );
}

/**
 * 新規ビザプランメッセージ送信時の通知
 * @param messageId メッセージID
 * @param planId ビザプランID
 * @param userId ユーザーID
 * @param userName ユーザー名
 * @param title メッセージタイトル
 * @param content メッセージ内容
 * @param isTest テストモードかどうか
 */
export async function notifyNewVisaPlanMessage(
  messageId: string,
  planId: string,
  userId: string,
  userName: string,
  title: string,
  content: string,
  isTest: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
    
    const startTime = Date.now();
    
    const result = await sendAdminNotification(
      '新規ビザプランメッセージ',
      `${userName}さんからビザプランについて新しいメッセージが届きました`,
      [
        { title: 'ユーザー', value: userName, short: true },
        { title: 'タイトル', value: title || '(タイトルなし)', short: true },
        { title: 'メッセージ', value: content?.substring(0, 100) + (content?.length > 100 ? '...' : '') },
        { title: 'リンク', value: `${appUrl}/admin/visa-plan-messages/${planId}` },
      ],
      isTest
    );
    
    const processingTime = Date.now() - startTime;
    
    return result;
  } catch (error) {
    return { ok: false, error: 'visa_plan_notification_error' };
  }
} 