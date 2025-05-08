"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, ArrowUpRight, Briefcase, Globe, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// カスタムバッジコンポーネント（ホバーエフェクトなし）
const StaticBadge = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent",
      className
    )}>
      {children}
    </div>
  );
};

// カテゴリ情報の型定義
interface CategoryInfo {
  name: string;
  memberCount: number;
  newMembersCount: number;
  growthRate: number;
  positions: string[];
  returneeCount?: number; // オプショナルに変更
  generalChannelMembers?: number; // オプショナルのまま
}

interface CommunityCategoriesProps {
  categories: CategoryInfo[];
}

export default function CommunityCategories({ categories }: CommunityCategoriesProps) {
  // 新規参加者数のローディング状態を管理
  const [loadingNewMembers, setLoadingNewMembers] = useState<Record<string, boolean>>({});
  const [newMembersCounts, setNewMembersCounts] = useState<Record<string, number>>({});
  // ダイアログの開閉状態を管理
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // 現在選択されているカテゴリを管理
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // コンポーネントマウント時に新規参加者数の取得を開始
  useEffect(() => {
    const fetchNewMembersCount = async () => {
      // 各カテゴリの新規参加者数を非同期で取得
      for (const category of categories) {
        // ローディング状態を設定
        setLoadingNewMembers(prev => ({ ...prev, [category.name]: true }));
        
        try {
          // 新規参加者数を取得するAPIエンドポイントを呼び出す
          const response = await fetch(`/api/slack?action=new-members-count&category=${category.name}`);
          const data = await response.json();
          
          // 取得した新規参加者数を状態に保存
          setNewMembersCounts(prev => ({ 
            ...prev, 
            [category.name]: data.newMembersCount || category.newMembersCount 
          }));
        } catch (error) {
          console.error(`Error fetching new members count for ${category.name}:`, error);
          // エラー時はカテゴリの元の値を使用
          setNewMembersCounts(prev => ({ 
            ...prev, 
            [category.name]: category.newMembersCount 
          }));
        } finally {
          // ローディング状態を解除
          setLoadingNewMembers(prev => ({ ...prev, [category.name]: false }));
        }
      }
    };

    fetchNewMembersCount();
  }, [categories]);

  // カテゴリごとのアイコンを取得する関数
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tech':
        return '💻';
      case 'Business':
        return '📊';
      case 'Hospitality':
        return '🏨';
      case 'Healthcare':
        return '🏥';
      case 'Creative':
        return '🎨';
      default:
        return '🌐';
    }
  };

  // カテゴリごとの背景色クラスを取得する関数
  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case 'Tech':
        return 'border-blue-200 bg-white';
      case 'Business':
        return 'border-emerald-200 bg-white';
      case 'Hospitality':
        return 'border-amber-200 bg-white';
      case 'Healthcare':
        return 'border-red-200 bg-white';
      case 'Creative':
        return 'border-purple-200 bg-white';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  // カテゴリごとのアクセントカラーを取得する関数
  const getCategoryAccentColor = (category: string) => {
    switch (category) {
      case 'Tech':
        return 'text-blue-600';
      case 'Business':
        return 'text-emerald-600';
      case 'Hospitality':
        return 'text-amber-600';
      case 'Healthcare':
        return 'text-red-600';
      case 'Creative':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  // カテゴリごとのSlackワークスペースURLを取得する関数
  const getSlackUrl = (category: string) => {
    switch (category) {
      case 'Tech':
        return 'https://frog-events.slack.com'; // Frog SlackのURL
      default:
        return '#'; // 他のカテゴリは仮のURL
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">職種別コミュニティ</h2>
      <p className="text-gray-600 py-3 mb-3">
        各職種カテゴリのSlackコミュニティに参加して、同じ分野で活躍する仲間とつながりましょう。
        参加人数や新規参加者数、代表的な職種などを確認できます。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Card 
            key={category.name}
            className={`overflow-hidden border ${getCategoryColorClass(category.name)} shadow-sm hover:shadow-md transition-shadow`}
          >
            <CardHeader className="pb-2 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle className={`text-xl font-bold flex items-center gap-2 ${getCategoryAccentColor(category.name)}`}>
                  <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                  {category.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* メンバー数と新規参加者数 */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{category.memberCount}名が参加</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md">
                    <UserPlus className="h-4 w-4 text-gray-500" />
                    {loadingNewMembers[category.name] ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">計算中...</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {newMembersCounts[category.name] || category.newMembersCount}人が今月参加
                      </span>
                    )}
                  </div>
                </div>

                {/* 代表的な職種 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-1.5 text-gray-700">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    代表的な職種
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.positions.map((position) => (
                      <StaticBadge key={position} className="bg-gray-50 text-gray-700 border-gray-100">
                        {position}
                      </StaticBadge>
                    ))}
                  </div>
                </div>

                {/* 参加ボタン */}
                <Button 
                  className={`w-full mt-2 gap-1 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50`}
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setIsDialogOpen(true);
                  }}
                >
                  Slackコミュニティに参加する
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 追加情報 */}
      <Card className="mt-10 bg-white border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Globe className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">グローバルなコミュニティ</h3>
              <p className="text-gray-600">
                Frogのコミュニティは世界各国で活躍する日本人プロフェッショナルで構成されています。
                あなたの経験や知識を共有し、同時に新しい情報や機会を得ることができます。
                各カテゴリのSlackチャンネルに参加して、専門分野ごとの交流を深めましょう。
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50" asChild>
                  <a href="https://frog-events.slack.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 3a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm12-6a3 3 0 1 0-6 0 3 3 0 0 0 6 0zm3 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
                    </svg>
                    Frog Slackワークスペースを開く
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slackコミュニティ参加方法のダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className="text-2xl">{selectedCategory && getCategoryIcon(selectedCategory)}</span>
              <span className={selectedCategory && getCategoryAccentColor(selectedCategory)}>
                {selectedCategory}
              </span>
              コミュニティへの参加方法
            </DialogTitle>
            <DialogDescription className="pt-4">
              Frogの職種別Slackコミュニティに参加するには、以下の手順に従ってください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">参加手順</h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                <li>Frogのコース入学申請をこのサービスを通して行ってください。</li>
                <li>申請が承認されると、登録されたメールアドレスへ招待リンクが発行されます。</li>
                <li>招待リンクからSlackワークスペースに参加できます。</li>
                <li>参加後は、興味のあるチャンネルに自由に参加してください。</li>
              </ol>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-gray-700 text-sm">
                <strong>注意:</strong> コミュニティへの参加には、Frogのコース申請が必要です。
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="border-gray-200 text-gray-700"
              onClick={() => setIsDialogOpen(false)}
            >
              閉じる
            </Button>
            <Button
              className={`${selectedCategory && getCategoryAccentColor(selectedCategory)} bg-white`}
              variant="outline"
              asChild
            >
              <a href="/dashboard/courses" className="flex items-center gap-2">
                コース一覧を見る
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 