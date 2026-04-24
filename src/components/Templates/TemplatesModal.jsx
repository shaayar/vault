import React, { useState, useEffect } from 'react'
import { X, FileText, Plus, Search, Calendar, Hash, Folder, Edit3, Trash2, Copy, Check } from 'lucide-react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'

/**
 * File Templates Modal
 */
export function TemplatesModal({ isOpen, onClose, onCreateFromTemplate }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateContent, setNewTemplateContent] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('custom')
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)

  const { activeVault } = useVaultStore()

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const loadTemplates = () => {
    // Default templates
    const defaultTemplates = [
      {
        id: 'daily-note',
        name: 'Daily Note',
        category: 'daily',
        content: `# {{date}}

## 📅 Today's Focus
- 

## 📝 Notes
- 

## 🎯 Tasks
- [ ] 

## 💭 Reflections



---
*Created on {{date}} at {{time}}*`,
        variables: ['date', 'time'],
        icon: '📅',
        description: 'Daily journal entry with tasks and reflections'
      },
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        category: 'work',
        content: `# {{meeting_title}}

**Date:** {{date}}  
**Time:** {{time}}  
**Attendees:** 
- 
- 

## 📋 Agenda
1. 
2. 
3. 

## 📝 Discussion Points



## ✅ Action Items
- [ ] **Owner:** **Deadline:** 
- [ ] **Owner:** **Deadline:** 

## 📅 Next Meeting
**Date:**  
**Time:**  

---
*Meeting notes created on {{date}}*`,
        variables: ['meeting_title', 'date', 'time'],
        icon: '🤝',
        description: 'Structured meeting notes with action items'
      },
      {
        id: 'project-plan',
        name: 'Project Plan',
        category: 'work',
        content: `# {{project_name}}

## 🎯 Project Overview
**Objective:** 
**Timeline:** 
**Budget:** 

## 📋 Key Milestones
1. **Milestone 1** - {{date}}
   - 
2. **Milestone 2** - 
   - 
3. **Milestone 3** - 
   - 

## 👥 Team Members
- **Lead:** 
- **Members:** 
   - 
   - 

## 🛠️ Resources Needed
- 
- 
- 

## 📊 Success Metrics
- 
- 
- 

## ⚠️ Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

---
*Project plan created on {{date}}*`,
        variables: ['project_name', 'date'],
        icon: '📊',
        description: 'Comprehensive project planning template'
      },
      {
        id: 'book-notes',
        name: 'Book Notes',
        category: 'personal',
        content: `# {{book_title}}

**Author:** {{author}}  
**Genre:** {{genre}}  
**Started:** {{date}}  
**Finished:** 

## 📖 Summary



## 💭 Key Takeaways
1. 
2. 
3. 

## 📝 Favorite Quotes
> 

> 

> 

## 🌟 Rating
⭐⭐⭐⭐⭐

## 🏷️ Tags
#book-notes #{{genre}} #reading

---
*Book notes created on {{date}}*`,
        variables: ['book_title', 'author', 'genre', 'date'],
        icon: '📚',
        description: 'Structured book reading notes'
      },
      {
        id: 'recipe',
        name: 'Recipe',
        category: 'personal',
        content: `# {{recipe_name}}

## 🍳 Ingredients
- 
- 
- 
- 

## 👨‍🍳 Instructions
1. 
2. 
3. 
4. 
5. 

## ⏰ Cooking Time
**Prep:** {{prep_time}}  
**Cook:** {{cook_time}}  
**Total:** {{total_time}}

## 🍽️ Servings
{{servings}} people

## 📝 Notes



## 🏷️ Tags
#recipe #{{cuisine_type}}

---
*Recipe added on {{date}}*`,
        variables: ['recipe_name', 'prep_time', 'cook_time', 'total_time', 'servings', 'cuisine_type', 'date'],
        icon: '🍳',
        description: 'Recipe template with ingredients and instructions'
      },
      {
        id: 'learning-log',
        name: 'Learning Log',
        category: 'education',
        content: `# {{topic}}

## 🎯 Learning Goal
{{learning_goal}}

## 📚 Resources
- 
- 
- 

## 📝 Key Concepts
### Concept 1: 
**Definition:** 
**Example:** 

### Concept 2: 
**Definition:** 
**Example:** 

## 🔬 Practice Exercises
1. 
2. 
3. 

## 💡 Insights & Discoveries



## 🤔 Questions & Areas for Further Research



## 📈 Progress
**Started:** {{date}}  
**Status:** 

## 🏷️ Tags
#learning #{{topic}} #education

---
*Learning log started on {{date}}*`,
        variables: ['topic', 'learning_goal', 'date'],
        icon: '🎓',
        description: 'Structured learning and skill development log'
      },
      {
        id: 'blank-note',
        name: 'Blank Note',
        category: 'basic',
        content: `# {{title}}

`,
        variables: ['title'],
        icon: '📄',
        description: 'Simple blank note template'
      }
    ]

    // Load custom templates from localStorage
    const customTemplates = JSON.parse(localStorage.getItem('vaultnote:templates') || '[]')
    
    setTemplates([...defaultTemplates, ...customTemplates])
  }

  const saveCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      category: newTemplateCategory,
      content: newTemplateContent,
      variables: extractVariables(newTemplateContent),
      icon: '📝',
      description: 'Custom template',
      isCustom: true
    }

    const customTemplates = JSON.parse(localStorage.getItem('vaultnote:templates') || '[]')
    customTemplates.push(newTemplate)
    localStorage.setItem('vaultnote:templates', JSON.stringify(customTemplates))

    setTemplates([...templates, newTemplate])
    setNewTemplateName('')
    setNewTemplateContent('')
    setIsCreating(false)
  }

  const deleteCustomTemplate = (templateId) => {
    const customTemplates = JSON.parse(localStorage.getItem('vaultnote:templates') || '[]')
    const filtered = customTemplates.filter(t => t.id !== templateId)
    localStorage.setItem('vaultnote:templates', JSON.stringify(filtered))
    
    setTemplates(templates.filter(t => t.id !== templateId))
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null)
    }
  }

  const extractVariables = (content) => {
    const regex = /\{\{(\w+)\}\}/g
    const variables = []
    let match
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }
    return variables
  }

  const processTemplate = (template, values = {}) => {
    let processedContent = template.content
    
    // Replace variables
    template.variables.forEach(variable => {
      const value = values[variable] || getDefaultVariableValue(variable)
      processedContent = processedContent.replace(new RegExp(`{{${variable}}}`, 'g'), value)
    })
    
    return processedContent
  }

  const getDefaultVariableValue = (variable) => {
    const now = new Date()
    switch (variable) {
      case 'date':
        return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      case 'time':
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      case 'title':
        return 'Untitled'
      default:
        return `{{${variable}}}`
    }
  }

  const handleCreateFromTemplate = async (template) => {
    if (!activeVault) return

    setIsCreating(true)
    
    try {
      const processedContent = processTemplate(template)
      const fileName = `${template.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`
      
      await onCreateFromTemplate(fileName, processedContent)
      onClose()
    } catch (error) {
      console.error('Failed to create note from template:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const categories = [
    { id: 'all', name: 'All Templates', icon: FileText },
    { id: 'basic', name: 'Basic', icon: FileText },
    { id: 'daily', name: 'Daily', icon: Calendar },
    { id: 'work', name: 'Work', icon: Folder },
    { id: 'personal', name: 'Personal', icon: Edit3 },
    { id: 'education', name: 'Education', icon: Hash },
    { id: 'custom', name: 'Custom', icon: Plus }
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              File Templates
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search and Create */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 p-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            )
          })}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  {template.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCustomTemplate(template.id)
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Variables:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map(variable => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs rounded"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCreateFromTemplate(template)
                    }}
                    disabled={isCreating}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>No templates found</p>
            </div>
          )}
        </div>

        {/* Template Preview */}
        {selectedTemplate && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Preview: {selectedTemplate.name}
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedTemplate.content)
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg max-h-40 overflow-y-auto">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {selectedTemplate.content}
              </pre>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Create New Template
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Enter template name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="custom">Custom</option>
                    <option value="basic">Basic</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="education">Education</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Template Content
                  </label>
                  <textarea
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
                    rows={8}
                    placeholder="Enter template content... Use {{variable}} for placeholders"
                  />
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Use {{variable}} for placeholders. Available: {{date}}, {{time}}, {{title}}, etc.
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveCustomTemplate}
                  disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewTemplateName('')
                    setNewTemplateContent('')
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
