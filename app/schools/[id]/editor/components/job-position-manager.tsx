"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { Briefcase, Check, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// JobPosition type definition
interface JobPosition {
  id: string
  title: string
  description: string | null
  industry: string | null
}

// Component Props type
interface JobPositionManagerProps {
  schoolId: string
  courseId: string
  token: string
  email: string
}

export function JobPositionManager({ schoolId, courseId, token, email }: JobPositionManagerProps) {
  // State management
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [initialSelectedPositions, setInitialSelectedPositions] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Get all job positions
        const allPositionsRes = await fetch('/api/job-positions')
        const allPositionsData = await allPositionsRes.json()
        
        if (!allPositionsRes.ok) {
          throw new Error(allPositionsData.error || 'Failed to retrieve job positions')
        }
        
        setJobPositions(allPositionsData)
        
        // Set all industry categories to expanded state initially
        const industries = [...new Set(allPositionsData
          .map((pos: JobPosition) => pos.industry)
          .filter(Boolean))] as string[]
        setExpandedCategories(industries)
        
        // 2. Get job positions associated with this course
        const coursePositionsRes = await fetch(`/api/schools/${schoolId}/courses/${courseId}/job-positions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Email': email
          }
        })
        
        const coursePositionsData = await coursePositionsRes.json()
        
        if (!coursePositionsRes.ok) {
          throw new Error(coursePositionsData.error || 'Failed to retrieve job positions associated with the course')
        }
        
        // Create array of job position IDs associated with the course
        const selectedIds = coursePositionsData.map((item: any) => item.job_position_id)
        setSelectedPositions(selectedIds)
        setInitialSelectedPositions(selectedIds)
      } catch (error) {
        console.error('Error fetching job positions:', error)
        toast.error('An error occurred while retrieving job position information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [courseId, schoolId, token, email])
  
  // Calculate job positions grouped by industry category
  const groupedPositions = useMemo(() => {
    // Group by industry category
    const grouped: Record<string, JobPosition[]> = {}
    
    // Group for positions without category
    grouped['Other'] = []
    
    // Group by industry category
    jobPositions.forEach(position => {
      const industry = position.industry || 'Other'
      if (!grouped[industry]) {
        grouped[industry] = []
      }
      grouped[industry].push(position)
    })
    
    // Sort positions by title within each group
    Object.keys(grouped).forEach(industry => {
      grouped[industry].sort((a, b) => a.title.localeCompare(b.title))
    })
    
    return grouped
  }, [jobPositions])
  
  // Toggle category expansion state
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }
  
  // Expand/collapse all categories
  const toggleAllCategories = (e?: React.MouseEvent) => {
    // イベントが提供された場合は伝播を停止
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (expandedCategories.length === Object.keys(groupedPositions).length) {
      setExpandedCategories([])
    } else {
      setExpandedCategories(Object.keys(groupedPositions))
    }
  }
  
  // Toggle selection state
  const togglePosition = (positionId: string) => {
    setSelectedPositions(prev => {
      if (prev.includes(positionId)) {
        return prev.filter(id => id !== positionId)
      } else {
        return [...prev, positionId]
      }
    })
  }
  
  // Save changes
  const saveChanges = async () => {
    setSaving(true)
    
    try {
      // Save selected positions
      const response = await fetch(`/api/schools/${schoolId}/courses/${courseId}/job-positions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Email': email
        },
        body: JSON.stringify({
          jobPositionIds: selectedPositions
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update job positions')
      }
      
      // Update initial selection state
      setInitialSelectedPositions([...selectedPositions])
      
      toast.success('Job positions updated successfully')
    } catch (error) {
      console.error('Error saving job positions:', error)
      toast.error('An error occurred while updating job positions')
    } finally {
      setSaving(false)
    }
  }
  
  // Check if there are any changes
  const hasChanges = () => {
    if (selectedPositions.length !== initialSelectedPositions.length) {
      return true
    }
    
    // 選択内容の差分をチェック
    const hasChangedSelections = selectedPositions.some(id => !initialSelectedPositions.includes(id))
    const hasRemovedSelections = initialSelectedPositions.some(id => !selectedPositions.includes(id))
    
    return hasChangedSelections || hasRemovedSelections
  }
  
  // Saveボタンの表示制御用のメモ化された値
  const shouldShowSaveButton = useMemo(() => {
    return hasChanges() && !saving && !loading
  }, [selectedPositions, initialSelectedPositions, saving, loading])
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          Career Opportunities
        </CardTitle>
        
        <div className="flex space-x-2">
          <Button 
            onClick={(e) => toggleAllCategories(e)}
            variant="outline"
            size="sm"
          >
            {expandedCategories.length === Object.keys(groupedPositions).length ? 'Collapse All' : 'Expand All'}
          </Button>
          
          {shouldShowSaveButton && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                saveChanges();
              }} 
              disabled={saving || loading}
              size="sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : Object.keys(groupedPositions).length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No job positions available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display by industry category */}
            {Object.keys(groupedPositions)
              .sort((a, b) => {
                // Display Other category last
                if (a === 'Other') return 1
                if (b === 'Other') return -1
                return a.localeCompare(b)
              })
              .map(category => {
                const positions = groupedPositions[category]
                const isExpanded = expandedCategories.includes(category)
                const countSelected = positions.filter(pos => selectedPositions.includes(pos.id)).length
                
                return (
                  <div key={category} className="border rounded-md overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="mr-2 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{category}</span>
                        {countSelected > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {countSelected} selected
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                        {positions.map(position => (
                          <div key={position.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-slate-50">
                            <Checkbox
                              id={`position-${position.id}`}
                              checked={selectedPositions.includes(position.id)}
                              onCheckedChange={() => togglePosition(position.id)}
                              className="mt-1"
                            />
                            <div className="space-y-1 flex-1">
                              <Label
                                htmlFor={`position-${position.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {position.title}
                              </Label>
                              {position.description && (
                                <div className="text-sm text-muted-foreground">
                                  {position.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 