import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function getPendingReviewCount(userId?: string) {
  try {
    const supabase = createClientComponentClient()
    const query = supabase.from('visa_plan_reviews').select('id', { count: 'exact' }).eq('status', 'pending')

    if (userId) {
      query.eq('reviewer_id', userId)
    }

    const { count, error } = await query
    if (error) {
      return null
    }
    return count
  } catch (error) {
    return null
  }
}

export async function getVisaPlanReviews(planId: string) {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('visa_plan_reviews')
      .select(`
        *,
        reviewer:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
    
    if (error) {
      return null
    }
    
    return data
  } catch (error) {
    return null
  }
}

export async function updateReviewStatus(reviewId: string, status: 'pending' | 'completed' | 'cancelled', reviewerNotes?: string) {
  try {
    const supabase = createClientComponentClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (reviewerNotes) {
      updateData.reviewer_notes = reviewerNotes
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('visa_plan_reviews')
      .update(updateData)
      .eq('id', reviewId)
      
    if (error) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}