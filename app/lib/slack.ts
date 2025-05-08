import { WebClient } from '@slack/web-api';
import { COMMUNITY_CATEGORIES, CATEGORY_CHANNEL_MAP } from './categories';

// XAPPトークンを使用したクライアント（authorizations:readスコープ用）
const SLACK_XAPP_TOKEN = process.env.SLACK_XAPP_TOKEN;
export const xappClient = new WebClient(SLACK_XAPP_TOKEN);

// Botトークンを使用したクライアント（チャンネル情報取得用）
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
export const botClient = new WebClient(SLACK_BOT_TOKEN);

// メインのSlackクライアント（優先順位: BOT > XAPP > ダミー）
export const slackClient = new WebClient(SLACK_BOT_TOKEN || SLACK_XAPP_TOKEN || 'xoxp-dummy');

// Frog SlackのワークスペースID
export const FROG_WORKSPACE_ID = 'T87M2FQGH';

// Frog SlackのgeneralチャンネルID
export const GENERAL_CHANNEL_ID = 'C87M2FQHW';

/**
 * カテゴリごとの代表的な職種
 * 
 * 各カテゴリに対応する代表的な職種を設定します。
 * 新しいカテゴリを追加する場合は、ここに職種を追加してください。
 * 
 * 注意: カテゴリを追加する場合は、以下の3箇所を更新する必要があります：
 * 1. app/lib/categories.ts の COMMUNITY_CATEGORIES
 * 2. app/lib/categories.ts の CATEGORY_CHANNEL_MAP
 * 3. このファイルの CATEGORY_POSITIONS
 */
export const CATEGORY_POSITIONS: Record<string, string[]> = {
  [COMMUNITY_CATEGORIES.TECH]: ['Software Engineer', 'Product Designer', 'Data Scientist', 'DevOps Engineer'],
  [COMMUNITY_CATEGORIES.BUSINESS]: ['Product Manager', 'Marketing Manager', 'Business Analyst', 'Sales Representative'],
  [COMMUNITY_CATEGORIES.HOSPITALITY]: ['Hotel Manager', 'Chef', 'Event Coordinator', 'Tourism Guide'],
  [COMMUNITY_CATEGORIES.HEALTHCARE]: ['Nurse', 'Doctor', 'Medical Researcher', 'Healthcare Administrator'],
  [COMMUNITY_CATEGORIES.CREATIVE]: ['Graphic Designer', 'UX/UI Designer', 'Content Creator', 'Art Director'],
  // 新しいカテゴリを追加する場合は、ここに職種を追加してください
  // 例: [COMMUNITY_CATEGORIES.FINANCE]: ['Financial Analyst', 'Accountant', 'Investment Banker', 'Financial Advisor'],
};

// チャンネル情報を取得する関数
export async function getChannelInfo(channelId: string) {
  try {
    const result = await slackClient.conversations.info({
      channel: channelId,
    });
    return result.channel;
  } catch (error) {
    console.error(`Error fetching channel info for ${channelId}:`, error);
    return null;
  }
}

// チャンネルのメンバー数を取得する関数
export async function getChannelMemberCount(channelId: string) {
  try {
    const result = await slackClient.conversations.info({
      channel: channelId,
    });
    return result.channel?.num_members || 0;
  } catch (error) {
    console.error(`Error fetching member count for ${channelId}:`, error);
    return 0;
  }
}

// conversations.membersを使用してチャンネルのメンバーリストを取得する関数
export async function getChannelMembers(channelId: string) {
  try {
    console.log(`Fetching members for channel ${channelId}...`);
    let members: string[] = [];
    let cursor: string | undefined;
    let pageCount = 0;
    
    // メインのクライアントで試す
    try {
      do {
        pageCount++;
        console.log(`Fetching page ${pageCount} of members...`);
        
        // APIパラメータを詳細に表示
        console.log('API呼び出しパラメータ:', {
          channel: channelId,
          cursor: cursor || 'なし',
          limit: 1000
        });
        
        const result = await slackClient.conversations.members({
          channel: channelId,
          cursor: cursor,
          limit: 1000, // 一度に最大1000人まで取得
        });
        
        if (result.members && result.members.length > 0) {
          console.log(`Found ${result.members.length} members on page ${pageCount}`);
          members = [...members, ...result.members];
        } else {
          console.log(`No members found on page ${pageCount}`);
          console.log('API応答:', result);
        }
        
        cursor = result.response_metadata?.next_cursor;
        console.log(`Next cursor: ${cursor || 'none'}`);
      } while (cursor);
      
      console.log(`Total members found for channel ${channelId}: ${members.length}`);
      return members;
    } catch (mainError: any) {
      console.error(`Error fetching members with main client:`, mainError);
      console.log('エラー詳細:', {
        name: mainError.name,
        message: mainError.message,
        code: mainError.code,
        data: mainError.data
      });
      
      // ボットトークンで試す
      if (botClient) {
        console.log('ボットトークンでメンバー取得を試みます');
        members = [];
        cursor = undefined;
        pageCount = 0;
        
        try {
          do {
            pageCount++;
            console.log(`ボットトークン: Fetching page ${pageCount} of members...`);
            
            const result = await botClient.conversations.members({
              channel: channelId,
              cursor: cursor,
              limit: 1000,
            });
            
            if (result.members && result.members.length > 0) {
              console.log(`ボットトークン: Found ${result.members.length} members on page ${pageCount}`);
              members = [...members, ...result.members];
            } else {
              console.log(`ボットトークン: No members found on page ${pageCount}`);
            }
            
            cursor = result.response_metadata?.next_cursor;
          } while (cursor);
          
          console.log(`ボットトークン: Total members found for channel ${channelId}: ${members.length}`);
          return members;
        } catch (botError: any) {
          console.error(`ボットトークンでのメンバー取得にも失敗:`, botError);
          console.log('ボットエラー詳細:', {
            name: botError.name,
            message: botError.message,
            code: botError.code,
            data: botError.data
          });
        }
      }
      
      // XAPPトークンで試す
      if (xappClient) {
        console.log('XAPPトークンでメンバー取得を試みます');
        members = [];
        cursor = undefined;
        pageCount = 0;
        
        try {
          do {
            pageCount++;
            console.log(`XAPPトークン: Fetching page ${pageCount} of members...`);
            
            const result = await xappClient.conversations.members({
              channel: channelId,
              cursor: cursor,
              limit: 1000,
            });
            
            if (result.members && result.members.length > 0) {
              console.log(`XAPPトークン: Found ${result.members.length} members on page ${pageCount}`);
              members = [...members, ...result.members];
            } else {
              console.log(`XAPPトークン: No members found on page ${pageCount}`);
            }
            
            cursor = result.response_metadata?.next_cursor;
          } while (cursor);
          
          console.log(`XAPPトークン: Total members found for channel ${channelId}: ${members.length}`);
          return members;
        } catch (xappError: any) {
          console.error(`XAPPトークンでのメンバー取得にも失敗:`, xappError);
          console.log('XAPPエラー詳細:', {
            name: xappError.name,
            message: xappError.message,
            code: xappError.code,
            data: xappError.data
          });
        }
      }
      
      // すべての方法が失敗した場合は空の配列を返す
      return [];
    }
  } catch (error: any) {
    console.error(`Error fetching members for channel ${channelId}:`, error);
    console.log('エラー詳細:', {
      name: error.name,
      message: error.message,
      code: error.code,
      data: error.data
    });
    return [];
  }
}

// generalチャンネルのメンバー数を取得する関数
export async function getGeneralChannelMemberCount() {
  console.log('=== getGeneralChannelMemberCount 開始 ===');
  console.log('GENERAL_CHANNEL_ID:', GENERAL_CHANNEL_ID);
  
  try {
    // 直接チャンネル情報を取得する方法を試す
    try {
      console.log('指定されたGENERAL_CHANNEL_IDでチャンネル情報を直接取得中...');
      const channelInfo = await slackClient.conversations.info({
        channel: GENERAL_CHANNEL_ID
      });
      
      if (channelInfo.channel) {
        console.log('チャンネル情報取得成功:', {
          id: channelInfo.channel.id,
          name: channelInfo.channel.name,
          is_general: channelInfo.channel.is_general,
          num_members: channelInfo.channel.num_members
        });
        
        if (channelInfo.channel.num_members) {
          console.log(`チャンネル情報からメンバー数を取得: ${channelInfo.channel.num_members}`);
          return channelInfo.channel.num_members;
        }
      } else {
        console.log('チャンネル情報が取得できませんでした');
      }
    } catch (directInfoError: any) {
      console.error('直接チャンネル情報の取得に失敗:', directInfoError);
      console.log('エラー詳細:', {
        name: directInfoError.name,
        message: directInfoError.message,
        code: directInfoError.code,
        data: directInfoError.data
      });
      
      // ボットトークンでの取得を試みる
      if (botClient) {
        try {
          console.log('ボットトークンでチャンネル情報取得を試みます');
          const botChannelInfo = await botClient.conversations.info({
            channel: GENERAL_CHANNEL_ID
          });
          
          if (botChannelInfo.channel) {
            console.log('ボットトークンでチャンネル情報取得成功:', {
              id: botChannelInfo.channel.id,
              name: botChannelInfo.channel.name,
              is_general: botChannelInfo.channel.is_general,
              num_members: botChannelInfo.channel.num_members
            });
            
            if (botChannelInfo.channel.num_members) {
              console.log(`ボットトークンからメンバー数を取得: ${botChannelInfo.channel.num_members}`);
              return botChannelInfo.channel.num_members;
            }
          }
        } catch (botError: any) {
          console.error('ボットトークンでのチャンネル情報取得にも失敗:', botError);
          console.log('ボットエラー詳細:', {
            name: botError.name,
            message: botError.message,
            code: botError.code,
            data: botError.data
          });
        }
      } else {
        console.log('ボットトークンが設定されていないため、スキップします');
      }
      
      // XAPPトークンでの取得を試みる
      if (xappClient) {
        try {
          console.log('XAPPトークンでチャンネル情報取得を試みます');
          const xappChannelInfo = await xappClient.conversations.info({
            channel: GENERAL_CHANNEL_ID
          });
          
          if (xappChannelInfo.channel) {
            console.log('XAPPトークンでチャンネル情報取得成功:', {
              id: xappChannelInfo.channel.id,
              name: xappChannelInfo.channel.name,
              is_general: xappChannelInfo.channel.is_general,
              num_members: xappChannelInfo.channel.num_members
            });
            
            if (xappChannelInfo.channel.num_members) {
              console.log(`XAPPトークンからメンバー数を取得: ${xappChannelInfo.channel.num_members}`);
              return xappChannelInfo.channel.num_members;
            }
          }
        } catch (xappError: any) {
          console.error('XAPPトークンでのチャンネル情報取得にも失敗:', xappError);
          console.log('XAPPエラー詳細:', {
            name: xappError.name,
            message: xappError.message,
            code: xappError.code,
            data: xappError.data
          });
        }
      } else {
        console.log('XAPPトークンが設定されていないため、スキップします');
      }
    }
    
    // チャンネル一覧から検索する方法を試す
    console.log('チャンネル一覧の取得開始...');
    const channelsResult = await slackClient.conversations.list({
      types: 'public_channel',
      team_id: FROG_WORKSPACE_ID,
      exclude_archived: true
    });
    
    console.log(`Found ${channelsResult.channels?.length || 0} channels in workspace`);
    
    // generalチャンネルを検索
    const generalChannel = channelsResult.channels?.find(channel => 
      channel.id === GENERAL_CHANNEL_ID || channel.name === 'general' || channel.is_general
    );
    
    if (generalChannel) {
      console.log('Found general channel:', {
        id: generalChannel.id,
        name: generalChannel.name,
        is_general: generalChannel.is_general,
        num_members: generalChannel.num_members
      });
      
      if (generalChannel.num_members) {
        console.log(`チャンネル一覧からメンバー数を取得: ${generalChannel.num_members}`);
        return generalChannel.num_members;
      }
    } else {
      console.log('General channel not found in channel list');
      
      // XAPPトークンでチャンネル一覧を取得
      if (xappClient) {
        try {
          console.log('XAPPトークンでチャンネル一覧取得を試みます');
          const xappChannelsResult = await xappClient.conversations.list({
            types: 'public_channel',
            team_id: FROG_WORKSPACE_ID,
            exclude_archived: true
          });
          
          console.log(`XAPPトークンで ${xappChannelsResult.channels?.length || 0} チャンネルを取得`);
          
          const xappGeneralChannel = xappChannelsResult.channels?.find(channel => 
            channel.id === GENERAL_CHANNEL_ID || channel.name === 'general' || channel.is_general
          );
          
          if (xappGeneralChannel) {
            console.log('XAPPトークンでgeneralチャンネルを発見:', {
              id: xappGeneralChannel.id,
              name: xappGeneralChannel.name,
              is_general: xappGeneralChannel.is_general,
              num_members: xappGeneralChannel.num_members
            });
            
            if (xappGeneralChannel.num_members) {
              console.log(`XAPPトークンのチャンネル一覧からメンバー数を取得: ${xappGeneralChannel.num_members}`);
              return xappGeneralChannel.num_members;
            }
          }
        } catch (xappListError: any) {
          console.error('XAPPトークンでのチャンネル一覧取得に失敗:', xappListError);
          console.log('XAPPエラー詳細:', {
            name: xappListError.name,
            message: xappListError.message,
            code: xappListError.code,
            data: xappListError.data
          });
        }
      }
    }
    
    // conversations.membersを使用してメンバー数を取得
    console.log('conversations.membersを使用してメンバー数を取得します');
    const members = await getChannelMembers(GENERAL_CHANNEL_ID);
    console.log(`Found ${members.length} members in general channel using conversations.members`);
    return members.length;
  } catch (error: any) {
    console.error('Error fetching general channel member count:', error);
    console.log('エラー詳細:', {
      name: error.name,
      message: error.message,
      code: error.code,
      data: error.data
    });
    
    return 0;
  }
}

// カテゴリごとのメンバー数を取得する関数
export async function getCategoryMemberCount(category: string): Promise<number> {
  try {
    console.log(`Getting member count for category: ${category}`);
    
    // カテゴリに関連するチャンネルIDを取得
    const channelIds = CATEGORY_CHANNEL_MAP[category] || [];
    
    if (channelIds.length === 0) {
      console.log(`No channels found for category: ${category}, using default count`);
      return 150; // デフォルト値
    }
    
    // 最初のチャンネルのメンバー数を取得
    const memberCount = await getChannelMemberCount(channelIds[0]);
    return memberCount;
  } catch (error) {
    console.error(`Error getting member count for category ${category}:`, error);
    return 150; // エラー時はデフォルト値
  }
}

// カテゴリごとの新規参加者数を取得する関数
export async function getCategoryNewMembersCount(category: string) {
  const channelIds = CATEGORY_CHANNEL_MAP[category] || [];
  let totalNewMembers = 0;

  for (const channelId of channelIds) {
    const newMembersCount = await getNewMembersCount(channelId);
    totalNewMembers += newMembersCount;
  }

  // チャンネルがない場合や新規メンバーが0の場合は、メンバー数の10%を新規メンバー数と仮定
  if (channelIds.length === 0 || totalNewMembers === 0) {
    const memberCount = await getCategoryMemberCount(category);
    totalNewMembers = Math.floor(memberCount * 0.1);
  }

  return totalNewMembers;
}

// Slackワークスペースのユーザー数を取得する関数
export async function getWorkspaceUserCount() {
  try {
    const result = await slackClient.users.list({
      team_id: FROG_WORKSPACE_ID,
      limit: 1000, // 最大1000人まで取得
    });
    
    // 非botユーザーのみをカウント
    const realUsers = result.members?.filter(member => !member.is_bot && !member.deleted) || [];
    return realUsers.length;
  } catch (error) {
    console.error('Error fetching workspace user count:', error);
    return 0;
  }
}

// Techコミュニティの情報を取得する関数
export async function getTechCommunityInfo() {
  console.log('=== getTechCommunityInfo 開始 ===');
  console.log('SLACK_XAPP_TOKEN:', process.env.SLACK_XAPP_TOKEN ? `設定済み (長さ: ${process.env.SLACK_XAPP_TOKEN.length})` : '未設定');
  console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? `設定済み (長さ: ${process.env.SLACK_BOT_TOKEN.length})` : '未設定');
  console.log('FROG_WORKSPACE_ID:', FROG_WORKSPACE_ID);
  console.log('GENERAL_CHANNEL_ID:', GENERAL_CHANNEL_ID);
  
  try {
    // generalチャンネルのメンバー数を取得
    console.log('generalチャンネルのメンバー数取得開始');
    const generalMemberCount = await getGeneralChannelMemberCount();
    console.log('generalチャンネルのメンバー数:', generalMemberCount);
    
    // ワークスペース全体のユーザー数を取得
    console.log('ワークスペース全体のユーザー数取得開始');
    const workspaceMemberCount = await getWorkspaceUserCount();
    console.log('ワークスペース全体のユーザー数:', workspaceMemberCount);
    
    // 直近一ヶ月の新規参加者数を取得
    console.log('直近一ヶ月の新規参加者数取得開始');
    const newMembersCount = await getNewMembersCount(GENERAL_CHANNEL_ID);
    console.log('直近一ヶ月の新規参加者数:', newMembersCount);
    
    const positions = CATEGORY_POSITIONS[COMMUNITY_CATEGORIES.TECH] || [];
    
    // generalチャンネルのメンバー数が0の場合は、ワークスペース全体のユーザー数を使用
    const memberCount = generalMemberCount > 0 ? generalMemberCount : workspaceMemberCount;
    console.log('最終的なメンバー数:', memberCount, '(generalチャンネル:', generalMemberCount, ', ワークスペース:', workspaceMemberCount, ')');
    
    // 成長率を計算（新規メンバー数 / 全メンバー数）
    const growthRate = memberCount > 0 ? (newMembersCount / memberCount) * 100 : 0;
    console.log(`成長率: ${growthRate.toFixed(1)}% (${newMembersCount}/${memberCount})`);
    
    const result = {
      name: COMMUNITY_CATEGORIES.TECH,
      memberCount,
      newMembersCount,
      growthRate: parseFloat(growthRate.toFixed(1)),
      positions,
      generalChannelMembers: generalMemberCount,
    };
    
    console.log('=== getTechCommunityInfo 完了 ===', result);
    return result;
  } catch (error) {
    console.error('Error in getTechCommunityInfo:', error);
    
    // エラーが発生した場合は、デフォルト値を返す
    const result = {
      name: COMMUNITY_CATEGORIES.TECH,
      memberCount: 0,
      newMembersCount: 0,
      growthRate: 0,
      positions: CATEGORY_POSITIONS[COMMUNITY_CATEGORIES.TECH] || [],
      generalChannelMembers: 0,
    };
    
    console.log('=== getTechCommunityInfo エラー発生、デフォルト値を返します ===', result);
    return result;
  }
}

// Slack APIのトークンスコープを確認する関数
export async function checkTokenScopes() {
  try {
    console.log('=== Slack APIトークンスコープの確認 ===');
    const authTest = await slackClient.auth.test();
    console.log('認証テスト結果:', {
      ok: authTest.ok,
      url: authTest.url,
      team: authTest.team,
      user: authTest.user,
      team_id: authTest.team_id,
      user_id: authTest.user_id,
    });
    
    // チーム情報の取得
    try {
      // 通常のトークンでチーム情報取得を試みる
      try {
        const teamInfo = await slackClient.team.info({
          team: FROG_WORKSPACE_ID
        });
        console.log('チーム情報 (通常トークン):', teamInfo.team);
      } catch (teamError) {
        console.error('通常トークンでのチーム情報取得に失敗:', teamError);
        
        // XAPPトークンでチーム情報取得を試みる
        if (xappClient) {
          try {
            console.log('XAPPトークンでチーム情報取得を試みます');
            const xappTeamInfo = await xappClient.team.info({
              team: FROG_WORKSPACE_ID
            });
            console.log('チーム情報 (XAPPトークン):', xappTeamInfo.team);
          } catch (xappError) {
            console.error('XAPPトークンでのチーム情報取得にも失敗:', xappError);
          }
        } else {
          console.log('XAPPトークンが設定されていないため、チーム情報取得をスキップします');
        }
      }
    } catch (teamError) {
      console.error('チーム情報の取得に失敗:', teamError);
    }
    
    return authTest;
  } catch (error) {
    console.error('Slack APIトークンスコープの確認に失敗:', error);
    return null;
  }
}

// すべてのカテゴリ情報を取得する関数
export async function getAllCategoryInfo(skipNewMembersCount: boolean = true) {
  try {
    // トークンスコープを確認
    await checkTokenScopes();
    
    const categories = Object.values(COMMUNITY_CATEGORIES);
    const result = [];
    
    // Techコミュニティの情報を取得
    console.log('Techコミュニティ情報の取得開始');
    
    // generalチャンネルのメンバー数を取得
    const generalMemberCount = await getGeneralChannelMemberCount();
    console.log('generalチャンネルのメンバー数:', generalMemberCount);
    
    // ワークスペース全体のユーザー数を取得
    const workspaceMemberCount = await getWorkspaceUserCount();
    console.log('ワークスペース全体のユーザー数:', workspaceMemberCount);
    
    // 新規参加者数（初期表示時はスキップ）
    let techNewMembersCount = 0;
    if (!skipNewMembersCount) {
      techNewMembersCount = await getNewMembersCount(GENERAL_CHANNEL_ID);
    } else {
      // デフォルト値として全メンバーの5%を設定
      techNewMembersCount = Math.floor(generalMemberCount * 0.05);
    }
    
    const positions = CATEGORY_POSITIONS[COMMUNITY_CATEGORIES.TECH] || [];
    
    // generalチャンネルのメンバー数が0の場合は、ワークスペース全体のユーザー数を使用
    const memberCount = generalMemberCount > 0 ? generalMemberCount : workspaceMemberCount;
    
    // 成長率を計算
    const growthRate = memberCount > 0 ? (techNewMembersCount / memberCount) * 100 : 0;
    
    // Techコミュニティの情報をresultに追加
    result.push({
      name: COMMUNITY_CATEGORIES.TECH,
      memberCount,
      newMembersCount: techNewMembersCount,
      growthRate: parseFloat(growthRate.toFixed(1)),
      positions,
      generalChannelMembers: generalMemberCount,
      returneeCount: Math.floor(memberCount * 0.15), // 仮の帰国者数（全メンバーの15%）
    });
    
    // その他のコミュニティの情報を取得
    for (const category of categories) {
      if (category !== COMMUNITY_CATEGORIES.TECH) {
        const memberCount = await getCategoryMemberCount(category);
        
        // 新規参加者数（初期表示時はスキップ）
        let newMembersCount = 0;
        if (!skipNewMembersCount) {
          // 各カテゴリのチャンネルIDを取得
          const channelIds = CATEGORY_CHANNEL_MAP[category] || [];
          
          // カテゴリに関連するチャンネルがある場合、新規メンバー数を取得
          if (channelIds.length > 0) {
            for (const channelId of channelIds) {
              const channelNewMembers = await getNewMembersCount(channelId);
              newMembersCount += channelNewMembers;
            }
          } else {
            // チャンネルがない場合は、メンバー数の10%を新規メンバー数と仮定
            newMembersCount = Math.floor(memberCount * 0.1);
          }
        } else {
          // デフォルト値として全メンバーの5%を設定
          newMembersCount = Math.floor(memberCount * 0.05);
        }
        
        const positions = CATEGORY_POSITIONS[category] || [];
        
        // 成長率を計算
        const growthRate = memberCount > 0 ? (newMembersCount / memberCount) * 100 : 0;
        
        result.push({
          name: category,
          memberCount,
          newMembersCount,
          growthRate: parseFloat(growthRate.toFixed(1)),
          positions,
          returneeCount: Math.floor(memberCount * 0.15), // 仮の帰国者数（全メンバーの15%）
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in getAllCategoryInfo:', error);
    
    // エラーが発生した場合は、空の配列を返す
    return [];
  }
}

// 直近一ヶ月の新規参加者数を取得する関数
export async function getNewMembersCount(channelId: string) {
  try {
    console.log(`Fetching new members for channel ${channelId} in the last month...`);
    
    // 現在の日付から1ヶ月前の日付を計算
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    console.log(`Checking for members who joined after: ${oneMonthAgo.toISOString()}`);
    
    // 最適化: ワークスペース全体のユーザーリストを取得し、作成日時でソート
    try {
      console.log('Fetching workspace users and sorting by creation date...');
      const result = await slackClient.users.list({
        team_id: FROG_WORKSPACE_ID,
        limit: 200 // 最大200人まで取得（十分な数の新規ユーザーを含むはず）
      });
      
      if (!result.members || result.members.length === 0) {
        console.log('No users found in workspace');
        return 0;
      }
      
      // 非botユーザーのみをフィルタリング
      const realUsers = result.members.filter(member => !member.is_bot && !member.deleted);
      console.log(`Found ${realUsers.length} real users in workspace`);
      
      // ユーザーを作成日時でソート（新しい順）
      const sortedUsers = [...realUsers].sort((a, b) => {
        const userA = a as any;
        const userB = b as any;
        const createdA = userA.updated ? parseInt(userA.updated) * 1000 : 
                         userA.created ? parseInt(userA.created) * 1000 : 0;
        const createdB = userB.updated ? parseInt(userB.updated) * 1000 : 
                         userB.created ? parseInt(userB.created) * 1000 : 0;
        return createdB - createdA; // 降順（新しい順）
      });
      
      // チャンネルのメンバーIDリストを取得
      const channelMembers = await getChannelMembers(channelId);
      console.log(`Channel ${channelId} has ${channelMembers.length} members`);
      
      // チャンネルに所属する最新のユーザーを抽出
      const recentChannelMembers = sortedUsers
        .filter(user => channelMembers.includes(user.id as string))
        .slice(0, 30); // 最新の30人だけを確認
      
      console.log(`Checking ${recentChannelMembers.length} most recent channel members`);
      
      // 1ヶ月以内に参加したユーザーをカウント
      let newMembersCount = 0;
      
      for (const user of recentChannelMembers) {
        const userAny = user as any;
        let createdTs = 0;
        
        if (userAny.updated) {
          createdTs = parseInt(userAny.updated) * 1000;
        } else if (userAny.created) {
          createdTs = parseInt(userAny.created) * 1000;
        } else {
          continue; // 日時情報がない場合はスキップ
        }
        
        const createdDate = new Date(createdTs);
        
        // 1ヶ月以内に参加したユーザーをカウント
        if (createdDate > oneMonthAgo) {
          newMembersCount++;
          console.log(`User ${user.id} joined recently: ${createdDate.toISOString()}`);
        } else {
          // 日付順にソートしているので、1ヶ月より前のユーザーが見つかったら終了
          console.log(`Found user from before the target period: ${createdDate.toISOString()}`);
          break;
        }
      }
      
      console.log(`Found ${newMembersCount} new members in the last month`);
      return newMembersCount;
      
    } catch (workspaceError) {
      console.error('Error fetching workspace users:', workspaceError);
      
      // フォールバック: チャンネルメンバー数の5%を新規メンバー数と仮定
      const memberCount = await getChannelMemberCount(channelId);
      const estimatedNewMembers = Math.floor(memberCount * 0.05);
      console.log(`Using fallback estimate: ${estimatedNewMembers} (5% of ${memberCount})`);
      return estimatedNewMembers;
    }
  } catch (error) {
    console.error(`Error fetching new members for channel ${channelId}:`, error);
    return 0;
  }
}