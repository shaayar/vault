import { useRef } from 'react'
import { ChevronRight, Folder } from 'lucide-react'
import { useNoteStore } from '../../store/noteStore'
import { RenameInput } from './RenameInput'

/**
 * Folder Row Component - Renders a single folder in the tree
 */
export function FolderRow({ node, depth, children, handleDragStart, animationIndex = 0 }) {
  const ref = useRef(null)

  const {
    isExpanded,
    toggleExpand,
    isEmpty,
    showContextMenu,
    renameNode,
    stopRenaming,
    selectNode,
    isSelected
  } = useNoteStore()

  const isRenaming = useNoteStore(
    s => s.renamingNodeId === node.id
  )

  const expanded = isExpanded(node.id)
  const selected = isSelected(node.id)

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
  }

  const onDragStart = (e) => {
    handleDragStart(e, node)
  }

  return (
    <div>
      {/* Header */}
      <div
        ref={ref}
        data-node-id={node.id}
        data-drop-zone={node.id}
        draggable
        onDragStart={onDragStart}
        onDragEnd={handleDragEnd}
        style={{ marginLeft: depth * 16, animationDelay: `${animationIndex * 50}ms` }}
        onClick={(e) => {
          e.stopPropagation()
          selectNode(node.id)
          if (!isEmpty(node.id)) {
            toggleExpand(node.id)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          showContextMenu(node.id, e.clientX, e.clientY)
        }}
        className={`
          sidebar-node-animate flex items-center py-1 px-2 rounded-sm cursor-pointer
          ${selected
            ? 'bg-blue-100 text-blue-600'
            : expanded
              ? 'bg-slate-200 dark:bg-slate-700'
              : 'hover:bg-slate-200 dark:hover:bg-slate-700'}
        `}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 mr-2 transition-transform ${expanded ? 'rotate-90' : ''
            }`}
        />

        <Folder className="w-4 h-4 mr-2 text-amber-500" />

        {isRenaming ? (
          <RenameInput
            initialValue={node.name}
            onSave={async (name) => {
              await renameNode(node.id, name)
              stopRenaming()
            }}
            onCancel={stopRenaming}
          />
        ) : (
          <span className="text-sm font-medium">{node.name}</span>
        )}
      </div>

      {/* Children */}
      {expanded && (
        <div className="ml-2">
          {children.length === 0 ? (
            <div className="text-xs text-slate-400 px-2 py-1 italic">
              Empty folder
            </div>
          ) : (
            <>
              {children}
            </>
          )}
        </div>
      )}
    </div>
  )
}
