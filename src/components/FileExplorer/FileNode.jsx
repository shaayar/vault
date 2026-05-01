import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useNoteStore } from '../../store/noteStore'
import { useVaultStore } from '../../store/vaultStore'
import { encodeNotePath } from '../../utils/notePath'
import { RenameInput } from './RenameInput'

/**
 * File Node Component - Renders a single note file in the tree
 */
export function FileNode({ node, depth, handleDragStart, animationIndex = 0 }) {
  const navigate = useNavigate()
  const {
    isSelected,
    selectNode,
    showContextMenu,
    renameNode,
    stopRenaming
  } = useNoteStore()

  const activeVault = useVaultStore(s => s.activeVault)
  const openNote = useNoteStore(s => s.openNote)

  const isRenaming = useNoteStore(
    s => s.renamingNodeId === node.id
  )

  const active = isSelected(node.id)

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
  }

  const onDragStart = (e) => {
    handleDragStart(e, node)
  }

  return (
    <div
      data-node-id={node.id}
      data-drop-zone={node.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      style={{ marginLeft: depth * 16, animationDelay: `${animationIndex * 50}ms` }}
      onClick={() => {
        selectNode(node.id)
        if (activeVault && node.path) {
          // Ensure path has .md extension for API compatibility
          const notePath = node.path.endsWith('.md') ? node.path : `${node.path}.md`
          openNote(activeVault, notePath)
          const encodedPath = encodeNotePath(notePath)
          navigate(`/${activeVault}/${encodedPath}`)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        showContextMenu(node.id, e.clientX, e.clientY)
      }}
      className={`
        sidebar-node-animate flex items-center py-1 px-2 mt-0.5 cursor-pointer
        ${active
          ? 'bg-blue-100 text-blue-600'
          : 'hover:bg-slate-200 dark:hover:bg-slate-700'}
      `}
    >
      <FileText className="w-4 h-4 mr-2 opacity-70" />

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
        <span className="text-sm">{node.name}</span>
      )}
    </div>
  )
}
