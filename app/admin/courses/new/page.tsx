"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { getJobPositions } from "@/lib/supabase/queries"
import { JobPosition } from "@/types/supabase"

// 科目の型定義
interface Subject {
  title: string;
  description: string;
}

export default function NewCoursePage() {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [description, setDescription] = useState("")
  const [totalWeeks, setTotalWeeks] = useState("")
  const [lectureWeeks, setLectureWeeks] = useState("")
  const [tuitionAndOthers, setTuitionAndOthers] = useState("")
  const [workPermitWeeks, setWorkPermitWeeks] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [admissionRequirements, setAdmissionRequirements] = useState("")
  const [graduationRequirements, setGraduationRequirements] = useState("")
  const [jobSupport, setJobSupport] = useState("")
  const [notes, setNotes] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [migrationGoals, setMigrationGoals] = useState<string[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [selectedJobPositions, setSelectedJobPositions] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClientComponentClient()

  // カテゴリーの選択肢
  const categoryOptions = [
    { value: "Business", label: "Business" },
    { value: "Technology", label: "Technology" },
    { value: "Hospitality", label: "Hospitality" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Creative", label: "Creative" }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 学校データの取得
        const { data: schoolsData, error: schoolsError } = await supabase
          .from("schools")
          .select("id, name")
          .order("name");

        if (schoolsError) {
          console.error("Error fetching schools:", schoolsError);
        } else {
          setSchools(schoolsData || []);
        }

        // 職業ポジションの取得
        const positions = await getJobPositions();
        setJobPositions(positions || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("データの取得に失敗しました");
      }
    };

    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 科目が登録されていない場合は、処理を中断
      if (subjects.length === 0) {
        toast.error("少なくとも1つの科目を追加してください");
        setLoading(false);
        return;
      }

      // 1. コースを作成
      const coursePayload = {
        name,
        category,
        start_date: startDate,
        description,
        total_weeks: Number.parseInt(totalWeeks) || null,
        lecture_weeks: Number.parseInt(lectureWeeks) || null,
        tuition_and_others: Number.parseFloat(tuitionAndOthers) || null,
        work_permit_weeks: Number.parseInt(workPermitWeeks) || null,
        school_id: schoolId,
        migration_goals: migrationGoals.length > 0 ? migrationGoals : null,
        admission_requirements: admissionRequirements || null,
        graduation_requirements: graduationRequirements || null,
        job_support: jobSupport || null,
        notes: notes || null
      };

      console.log("コース作成データ:", coursePayload);

      // コースの作成
      let courseId = "";
      try {
        const { data, error } = await supabase
          .from("courses")
          .insert([coursePayload])
          .select()
          .single();

        if (error) {
          console.error("コース作成エラー:", error);
          throw new Error(`コースの作成に失敗しました: ${error.message}`);
        }

        if (!data || !data.id) {
          throw new Error("コースは作成されましたが、IDの取得に失敗しました");
        }

        courseId = data.id;
        console.log("作成されたコースID:", courseId);
        
        // コース作成成功のメッセージを表示
        toast.success("コースの基本情報を作成しました");
      } catch (error) {
        console.error("コース作成処理エラー:", error);
        throw error;
      }

      // コースIDが取得できたことを確認
      if (!courseId) {
        throw new Error("コースIDが取得できないため、関連データの作成を中止します");
      }

      // 2. 職業ポジションの関連付け
      if (selectedJobPositions.length > 0) {
        try {
          // 認証状態を確認
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.error("認証エラー: セッションが存在しません");
            toast.error("認証エラー: ログインしなおしてください");
            return;
          }
          console.log("認証ユーザーID:", session.user.id);
          
          // 職業ポジションの関連付けデータを準備
          const jobPositionData = selectedJobPositions.map(positionId => ({
            course_id: courseId,
            job_position_id: positionId
          }));

          console.log("職業ポジション関連付けデータ:", jobPositionData);

          // 職業ポジションの関連付けを挿入
          const { error: jobPositionError } = await supabase
            .from("course_job_positions")
            .insert(jobPositionData);

          if (jobPositionError) {
            console.error("職業ポジションの関連付けエラー:", jobPositionError);
            console.error("エラー詳細:", {
              code: jobPositionError.code, 
              message: jobPositionError.message,
              details: jobPositionError.details,
              hint: jobPositionError.hint
            });
            toast.error(`職業ポジションの関連付けに失敗しました: ${jobPositionError.message}`);
          } else {
            toast.success("職業ポジションの関連付けを作成しました");
          }
        } catch (jobPositionError) {
          console.error("職業ポジション関連付け例外:", jobPositionError);
          toast.error("職業ポジションの関連付け中にエラーが発生しました");
          // 職業ポジションの関連付けに失敗しても、科目の作成は続行する
        }
      }

      // 3. 科目を作成
      console.log(`${subjects.length}個の科目を作成します。コースID: ${courseId}`);
      
      // 科目データをまとめて準備
      const subjectsToInsert = subjects.map(subject => ({
        course_id: courseId, // ここで先ほど作成したコースのIDを使用
        title: subject.title || "新しい科目",
        description: subject.description || "" // nullの場合は空文字に変換
      }));
      
      console.log("挿入する科目データ:", subjectsToInsert);
      
      // 科目の挿入処理
      let allSubjectsInserted = false;
      let successCount = 0;
      let failedSubjects: any[] = [];
      
      // まず一括挿入を試みる
      try {
        console.log("科目の一括挿入を試みます...");
        const { data, error: bulkError } = await supabase
          .from("course_subjects")
          .insert(subjectsToInsert)
          .select();
        
        if (bulkError) {
          console.error("科目の一括挿入に失敗しました:", bulkError);
          // 一括挿入に失敗した場合は個別に挿入を試みる
          console.log("個別挿入に切り替えます");
          failedSubjects = [...subjectsToInsert];
        } else {
          console.log("科目の一括挿入に成功しました:", data);
          successCount = data?.length || 0;
          allSubjectsInserted = true;
          toast.success(`${successCount}個の科目をすべて作成しました`);
        }
      } catch (error) {
        console.error("科目の一括挿入中に例外が発生しました:", error);
        failedSubjects = [...subjectsToInsert];
      }
      
      // 一括挿入に失敗した場合、個別に挿入を試みる
      if (failedSubjects.length > 0) {
        console.log(`${failedSubjects.length}個の科目を個別に挿入します...`);
        toast.loading(`${failedSubjects.length}個の科目を作成中...`);
        
        // 個別挿入の結果を追跡
        const successfulSubjects: any[] = [];
        const remainingFailedSubjects: any[] = [];
        
        // 各科目を個別に挿入
        for (const subject of failedSubjects) {
          try {
            // 少し待機してから挿入を試みる（レート制限対策）
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log(`科目「${subject.title}」を挿入します...`);
            const { data: singleData, error: singleError } = await supabase
              .from("course_subjects")
              .insert(subject)
              .select()
              .single();
            
            if (singleError) {
              console.error(`科目「${subject.title}」の挿入に失敗しました:`, singleError);
              remainingFailedSubjects.push(subject);
            } else {
              console.log(`科目「${subject.title}」の挿入に成功しました:`, singleData);
              successfulSubjects.push(subject);
              successCount++;
            }
          } catch (err) {
            console.error(`科目「${subject.title}」の挿入中に例外が発生しました:`, err);
            remainingFailedSubjects.push(subject);
          }
        }
        
        // 結果を表示
        if (successfulSubjects.length > 0) {
          toast.success(`${successfulSubjects.length}個の科目を作成しました`);
        }
        
        // 最終的な失敗数を確認
        if (remainingFailedSubjects.length === 0) {
          allSubjectsInserted = true;
          toast.success("すべての科目の作成が完了しました");
        } else {
          console.error(`${remainingFailedSubjects.length}個の科目の作成に失敗しました`);
          toast.error(`${remainingFailedSubjects.length}個の科目の作成に失敗しました`);
          
          // 失敗した科目の詳細をログに出力
          console.error("失敗した科目:", remainingFailedSubjects);
          
          // 科目の作成に失敗した場合、作成したコースを削除する選択肢をユーザーに提供
          if (confirm(`${remainingFailedSubjects.length}個の科目の作成に失敗しました。コースを削除して最初からやり直しますか？`)) {
            // コースを削除
            const { error: deleteError } = await supabase
              .from("courses")
              .delete()
              .eq("id", courseId);
            
            if (deleteError) {
              console.error("コース削除エラー:", deleteError);
              toast.error("コースの削除に失敗しました");
            } else {
              toast.success("コースを削除しました。最初からやり直してください。");
            }
            
            setLoading(false);
            return; // 科目の作成に失敗した場合は画面遷移しない
          }
        }
      }
      
      // 科目の作成が成功した場合のみ画面遷移する
      if (allSubjectsInserted) {
        toast.success("コースとカリキュラムの作成が完了しました");
        // 作成したコースの編集ページに遷移
        router.push(`/admin/courses/${courseId}/edit`);
      } else if (successCount > 0) {
        // 一部の科目が作成された場合
        if (confirm(`${successCount}個の科目が作成されました。残りの科目は編集画面で追加できます。編集画面に移動しますか？`)) {
          router.push(`/admin/courses/${courseId}/edit`);
        }
      } else {
        // 科目の作成に失敗した場合は画面遷移しない
        toast.error("カリキュラムの作成に失敗しました。再度試してください。");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`コースの作成中にエラーが発生しました: ${error.message || "不明なエラー"}`);
    } finally {
      setLoading(false);
    }
  }

  // 科目を追加
  const addSubject = () => {
    setSubjects([...subjects, { title: "新しい科目", description: "" }]);
  };

  // 科目を削除
  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  // 科目を更新
  const updateSubject = (index: number, field: keyof Subject, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setSubjects(updatedSubjects);
  };

  // 職業ポジションの選択状態を切り替える
  const toggleJobPosition = (jobPositionId: string) => {
    setSelectedJobPositions(prev => {
      if (prev.includes(jobPositionId)) {
        return prev.filter(id => id !== jobPositionId);
      } else {
        return [...prev, jobPositionId];
      }
    });
  };

  // 渡航目的の選択状態を切り替える
  const toggleMigrationGoal = (goal: string) => {
    setMigrationGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      } else {
        return [...prev, goal];
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">新規コース登録</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">コース名</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="category">カテゴリー</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">開始日</Label>
                <Input id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="例: 1月、5月、9月" />
              </div>
              <div>
                <Label htmlFor="schoolId">学校</Label>
                <Select value={schoolId} onValueChange={setSchoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="学校を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalWeeks">総週数</Label>
                <Input id="totalWeeks" type="number" value={totalWeeks} onChange={(e) => setTotalWeeks(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lectureWeeks">講義週数</Label>
                <Input id="lectureWeeks" type="number" value={lectureWeeks} onChange={(e) => setLectureWeeks(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tuitionAndOthers">学費その他（CAD$）</Label>
                <Input id="tuitionAndOthers" type="number" value={tuitionAndOthers} onChange={(e) => setTuitionAndOthers(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="workPermitWeeks">就労許可週数</Label>
                <Input id="workPermitWeeks" type="number" value={workPermitWeeks} onChange={(e) => setWorkPermitWeeks(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>追加情報</Label>
              <div className="grid grid-cols-1 gap-4 border rounded-md p-4">
                <div className="space-y-2">
                  <Label htmlFor="admission_requirements">入学条件</Label>
                  <Textarea
                    id="admission_requirements"
                    value={admissionRequirements}
                    onChange={(e) => setAdmissionRequirements(e.target.value)}
                    rows={2}
                    placeholder="例: IELTS 5.5以上、高校卒業以上"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduation_requirements">卒業要件</Label>
                  <Textarea
                    id="graduation_requirements"
                    value={graduationRequirements}
                    onChange={(e) => setGraduationRequirements(e.target.value)}
                    rows={2}
                    placeholder="例: 全科目の70%以上の出席、最終試験合格"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_support">就職サポート</Label>
                  <Textarea
                    id="job_support"
                    value={jobSupport}
                    onChange={(e) => setJobSupport(e.target.value)}
                    rows={2}
                    placeholder="例: 履歴書作成サポート、模擬面接、求人紹介"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">特記事項</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="例: オンラインコースも提供しています"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ※ 空欄の項目は表示されません
              </p>
            </div>

            {/* 渡航目的セクション */}
            <div className="space-y-2">
              <Label htmlFor="migration_goals">渡航目的（複数選択可）</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
                {["overseas_job", "improve_language", "career_change", "find_new_home"].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={migrationGoals.includes(goal)}
                      onCheckedChange={() => toggleMigrationGoal(goal)}
                    />
                    <Label htmlFor={`goal-${goal}`} className="text-sm cursor-pointer">
                      {goal === "overseas_job" && "海外就職"}
                      {goal === "improve_language" && "語学力向上"}
                      {goal === "career_change" && "キャリアチェンジ"}
                      {goal === "find_new_home" && "移住先探し"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 職業ポジション選択セクション */}
            <div className="space-y-2">
              <Label htmlFor="job-positions">目指せる職種</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                {jobPositions.map((position) => (
                  <div key={position.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`job-position-${position.id}`}
                      checked={selectedJobPositions.includes(position.id)}
                      onCheckedChange={() => toggleJobPosition(position.id)}
                    />
                    <Label
                      htmlFor={`job-position-${position.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {position.title}
                    </Label>
                  </div>
                ))}
                {jobPositions.length === 0 && (
                  <p className="text-sm text-muted-foreground">職業ポジションが見つかりません</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* カリキュラム（科目）セクション */}
        <Card className="shadow-sm bg-white">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>カリキュラム</Label>
              <Button type="button" onClick={addSubject} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                科目を追加
              </Button>
            </div>
            
            {subjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                科目が登録されていません
              </p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {subjects.map((subject, index) => (
                  <div key={index} className="space-y-3 p-4 rounded-lg border relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removeSubject(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    
                    <div>
                      <Label htmlFor={`subject-title-${index}`}>科目名</Label>
                      <Input
                        id={`subject-title-${index}`}
                        value={subject.title}
                        onChange={(e) => updateSubject(index, "title", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`subject-description-${index}`}>説明</Label>
                      <Textarea
                        id={`subject-description-${index}`}
                        value={subject.description}
                        onChange={(e) => updateSubject(index, "description", e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={loading} className="px-6">
            {loading ? "保存中..." : "コースを作成"}
          </Button>
        </div>
      </form>
    </div>
  )
}

