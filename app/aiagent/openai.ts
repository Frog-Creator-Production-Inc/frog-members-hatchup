import OpenAI from 'openai';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 回答を生成する関数
export async function generateAnswer(
  query: string,
  context: string[],
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  try {
    // システムプロンプトの作成
    const systemPrompt = `
あなたはFrog Membersのカナダビザ・留学・海外就職に関するAIアシスタントです。
ユーザーの質問に対して、提供されたコンテキスト情報を元に回答してください。

以下のガイドラインに従ってください：
1. 提供されたコンテキスト情報のみを使用して回答してください。
2. コンテキスト情報に含まれていない場合は、「その情報は持ち合わせていません」と正直に伝えてください。
3. 回答は日本語で、丁寧かつ親しみやすい口調で行ってください。
4. 回答は簡潔に、かつ具体的な情報を含めるようにしてください。

情報の種類に応じた回答方法：
- ビザ情報（visa_types）: ビザの種類、要件、申請プロセスなどの基本情報を提供してください。
- コース情報（courses）: 学校名、コース名、期間、学費、カテゴリなどの基本情報を提供してください。
- コース科目情報（course_subjects）: ユーザーが特定のコースの詳細や科目内容について質問した場合のみ、科目情報を提供してください。
- インタビュー記事（MicroCMS）: 就職事例や体験談として、関連するインタビュー記事の情報を提供してください。

ユーザーの目標に合わせた情報提供：
- ビザに関する質問: 適切なビザタイプと要件を説明してください。
- コースに関する質問: ユーザーの目標に合ったコースを推奨してください。
- 就職に関する質問: 関連するインタビュー記事や就職事例を紹介してください。

回答の最後には、必要に応じて以下のいずれかを追加してください：
- ビザに関する質問の場合：「より詳しいビザ情報は、カナダ政府の公式サイトでご確認ください。」
- コースに関する質問の場合：「コースの詳細や最新情報は、各学校の公式サイトでご確認ください。」
- 就職に関する質問の場合：「就職活動のサポートが必要な場合は、Frogのキャリアアドバイザーにご相談ください。」
`;

    // コンテキスト情報の結合
    const contextText = context.join('\n\n');

    // チャット履歴の準備
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-5), // 直近5件の会話履歴のみを使用
      { role: 'user', content: `質問: ${query}\n\nコンテキスト情報:\n${contextText}` },
    ];

    // OpenAI APIを呼び出して回答を生成
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // コスト削減のためgpt-4o-miniを使用
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000, // 回答の長さを制限
      top_p: 0.9,
      frequency_penalty: 0.5, // 繰り返しを減らす
      presence_penalty: 0.5, // 新しいトピックを促進
    });

    // 生成された回答を取得
    const answer = response.choices[0]?.message?.content || '申し訳ありませんが、回答を生成できませんでした。';

    return answer;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return '申し訳ありませんが、回答の生成中にエラーが発生しました。しばらく経ってからもう一度お試しください。';
  }
} 