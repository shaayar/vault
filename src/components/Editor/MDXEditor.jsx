import { MDXEditor } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import './mdx-editor-styles.css'
import { compressImage, shouldCompress, generateImageFilename } from '../../utils/imageUtils'
import { uploadImage } from '../../api/imageApi'
import { useVaultStore } from '../../store/vaultStore'
import {
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  ListsToggle,
  UndoRedo,
  Separator,
  thematicBreakPlugin,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  quotePlugin,
  markdownShortcutPlugin,
  toolbarPlugin
} from '@mdxeditor/editor'

async function imageUploadHandler(file) {
  const activeVault = useVaultStore.getState().activeVault
  if (!activeVault) {
    throw new Error('No active vault selected')
  }

  try {
    // Compress image if needed
    let processedFile = file
    if (shouldCompress(file)) {
      processedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      })
    }

    // Upload and return URL
    const url = await uploadImage(processedFile, activeVault)
    return url
  } catch (error) {
    console.error('Image upload failed:', error)
    throw error
  }
}

export function MDXEditorComponent({ value, onChange, isLight, disabled }) {
  return (
    <div className="h-[500px]">
      <MDXEditor
        markdown={value ?? '# Start typing...'}
        onChange={(v) => onChange?.(v)}
        contentEditableClassName={`prose max-w-none ${isLight
          ? 'prose-slate text-slate-900'
          : 'prose-invert text-slate-100'
          }`}
        className={isLight ? 'light-theme vaultnote-mdx-editor' : 'dark-theme vaultnote-mdx-editor'}
        readOnly={disabled}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          linkDialogPlugin({
            showLinkTitleField: true,
          }),
          imagePlugin({
            imageUploadHandler
          }),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarClassName: 'vaultnote-mdx-toolbar',
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <CreateLink />
                <InsertImage />
              </>
            )
          })
        ]}
      />
    </div>
  )
}
