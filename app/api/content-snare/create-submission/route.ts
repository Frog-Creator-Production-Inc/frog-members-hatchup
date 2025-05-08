import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    
    
    // Supabase繧ｯ繝ｩ繧､繧｢繝ｳ繝医ｒ菴懈・
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // 隱崎ｨｼ縺輔ｌ縺ｦ縺・↑縺・Μ繧ｯ繧ｨ繧ｹ繝医ｒ諡貞凄
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      
      return NextResponse.json({ error: "隱崎ｨｼ縺輔ｌ縺ｦ縺・∪縺帙ｓ" }, { status: 401 });
    }

    

    // 繝ｪ繧ｯ繧ｨ繧ｹ繝医・繝・ぅ繧定ｧ｣譫・    const body = await request.json();
    const { clientId, packageId } = body;

    if (!clientId || !packageId) {
      
      return NextResponse.json(
        { error: "clientId 縺ｨ packageId 縺悟ｿ・ｦ√〒縺・ }, 
        { status: 400 }
      );
    }

    

    // 繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ蜿門ｾ玲姶逡･
    let accessToken = '';
    
    // 1. 縺ｾ縺夂腸蠅・､画焚CONTENT_SNARE_ACCESS_TOKEN繧堤｢ｺ隱搾ｼ域怙繧ゆｿ｡鬆ｼ諤ｧ縺碁ｫ倥＞・・    if (process.env.CONTENT_SNARE_ACCESS_TOKEN) {
      
      accessToken = process.env.CONTENT_SNARE_ACCESS_TOKEN;
    } 
    // 2. 谺｡縺ｫ繝｡繝｢繝ｪ蜀・・荳譎ゅヨ繝ｼ繧ｯ繝ｳ繧堤｢ｺ隱・    else if (process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN) {
      
      accessToken = process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN;
    } 
    // 3. 譛蠕後↓繝・・繧ｿ繝吶・繧ｹ繧堤｢ｺ隱・    else {
      try {
        // 繧ｷ繧ｹ繝・Β蜈ｱ騾壹・Content Snare繝ｪ繝輔Ξ繝・す繝･繝医・繧ｯ繝ｳ繧貞叙蠕・        
        const { data: tokens, error: tokensError } = await supabase
          .from('refresh_tokens')
          .select('*')
          .eq('service_name', 'content_snare')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (tokensError) {
          
          return NextResponse.json({ error: "繝医・繧ｯ繝ｳ蜿門ｾ励お繝ｩ繝ｼ" }, { status: 500 });
        }
        
        if (!tokens || tokens.length === 0) {
          
          return NextResponse.json({ error: "Content Snare縺ｮ隱崎ｨｼ縺悟ｿ・ｦ√〒縺・ }, { status: 403 });
        }
        
        const contentSnareToken = tokens[0];
        console.log("Content Snare繝医・繧ｯ繝ｳ縺瑚ｦ九▽縺九ｊ縺ｾ縺励◆:", {
          id: contentSnareToken.id,
          token_length: contentSnareToken.refresh_token ? contentSnareToken.refresh_token.length : 0
        });
        
        // 繝ｪ繝輔Ξ繝・す繝･繝医・繧ｯ繝ｳ縺ｧ繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ繧貞叙蠕・        const refreshResponse = await fetch(`https://api.contentsnare.com/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: process.env.CONTENT_SNARE_CLIENT_ID,
            client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
            refresh_token: contentSnareToken.refresh_token
          })
        });
        
        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          
          return NextResponse.json({ error: "繝医・繧ｯ繝ｳ縺ｮ繝ｪ繝輔Ξ繝・す繝･縺ｫ螟ｱ謨励＠縺ｾ縺励◆" }, { status: 403 });
        }
        
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        // 譁ｰ縺励＞繝ｪ繝輔Ξ繝・す繝･繝医・繧ｯ繝ｳ繧偵す繧ｹ繝・Β逕ｨ縺ｫ菫晏ｭ・        await supabase
          .from('refresh_tokens')
          .update({
            refresh_token: refreshData.refresh_token,
            service_name: 'content_snare', // 蟆乗枚蟄励ｒ遒ｺ螳溘↓邯ｭ謖・            updated_at: new Date().toISOString()
          })
          .eq('id', contentSnareToken.id);
          
      } catch (error) {
        const dbError = error as Error;
        
        // 繝・・繧ｿ繝吶・繧ｹ繧ｨ繝ｩ繝ｼ縺ｯ辟｡隕悶＠縺ｦ邯夊｡・      }
    }
    
    // 繝医・繧ｯ繝ｳ縺瑚ｦ九▽縺九ｉ縺ｪ縺・ｴ蜷医・繧ｨ繝ｩ繝ｼ
    if (!accessToken) {
      
      return NextResponse.json(
        { error: "Content Snare縺ｮ繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・env.local繝輔ぃ繧､繝ｫ縺ｾ縺溘・迺ｰ蠅・､画焚縺ｫCONTENT_SNARE_ACCESS_TOKEN繧定ｨｭ螳壹＠縺ｦ縺上□縺輔＞縲・ }, 
        { status: 403 }
      );
    }

    // 繧ｵ繝悶Α繝・す繝ｧ繝ｳ菴懈・API繧貞他縺ｳ蜃ｺ縺・    const apiResponse = await fetch(`https://api.contentsnare.com/partner_api/v1/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Api-Key": process.env.CONTENT_SNARE_API_KEY || "",
        "X-Account-Id": process.env.CONTENT_SNARE_CLIENT_ID || ""
      },
      body: JSON.stringify({
        client_id: clientId,
        package_id: packageId
      })
    });

    // 繝ｬ繧ｹ繝昴Φ繧ｹ繧偵Ο繧ｰ縺ｫ蜃ｺ蜉・    const responseStatus = apiResponse.status;
    const responseText = await apiResponse.text();
    
    

    // API縺九ｉ縺ｮ繝ｬ繧ｹ繝昴Φ繧ｹ繧定ｧ｣譫舌＠縺ｦ霑斐☆
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: "Content Snare API繧ｨ繝ｩ繝ｼ", details: responseText, status: responseStatus }, 
        { status: responseStatus }
      );
    }

    try {
      const responseData = JSON.parse(responseText);
      return NextResponse.json(responseData);
    } catch (jsonError) {
      
      return NextResponse.json(
        { error: "繝ｬ繧ｹ繝昴Φ繧ｹ縺ｮ隗｣譫舌↓螟ｱ謨励＠縺ｾ縺励◆", raw: responseText }, 
        { status: 500 }
      );
    }
  } catch (error) {
    
    return NextResponse.json(
      { error: "繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆" }, 
      { status: 500 }
    );
  }
} 
