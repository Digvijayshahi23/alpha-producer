import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { http } from '@/api/http'
import { Button, Field, Input, Notice, Page, PageHeader, Panel, Textarea } from '@/ui/kit'
export function JournalScreen() {
  const queryClient = useQueryClient()
  const notesQuery = useQuery({
    queryKey: ['workbench', 'notes'],
    queryFn: async () => await http.get('workbench/notes'),
  })
  const [activeNote, setActiveNote] = useState(null)
  const saveMutation = useMutation({
    mutationFn: async (note) => {
      if (note.id) {
        return await http.put(`workbench/notes/${note.id}`, note)
      }
      return await http.post('workbench/notes', note)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['workbench', 'notes'] })
      setActiveNote(saved)
    },
  })
  return (
    <Page>
      <PageHeader
        title="Research Journal"
        description="Document your research process, read papers, and track broader ideas."
        actions={
          <Button onClick={() => setActiveNote({ title: '', content: '' })}>+ New Note</Button>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row items-start">
        <Panel className="w-full lg:w-1/3 max-h-[800px] overflow-y-auto" bodyClassName="p-2">
          {notesQuery.isLoading && <div className="p-4 text-ink-subtle">Loading...</div>}
          {!notesQuery.isLoading && notesQuery.data?.length === 0 && (
            <div className="p-4 text-ink-subtle">No notes yet.</div>
          )}
          <div className="flex flex-col gap-2">
            {notesQuery.data?.map((note) => (
              <button
                type="button"
                key={note.id}
                onClick={() => setActiveNote(note)}
                className={`flex flex-col gap-1 p-3 text-left rounded-md transition-colors hover:bg-surface-2 ${activeNote?.id === note.id ? 'bg-surface-2 border border-hairline' : ''}`}
              >
                <span className="font-medium text-ink truncate">
                  {note.title || 'Untitled Note'}
                </span>
                <span className="text-body-compact text-ink-subtle truncate">
                  {note.content || 'Empty note...'}
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          className="w-full lg:w-2/3 flex-1"
          title={activeNote?.id ? 'Edit Note' : activeNote ? 'New Note' : 'Select a note'}
        >
          {activeNote ? (
            <div className="flex flex-col gap-4">
              <Field label="Title">
                <Input
                  value={activeNote.title || ''}
                  onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                  placeholder="Note Title"
                />
              </Field>
              <Field label="Content">
                <Textarea
                  value={activeNote.content || ''}
                  onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                  placeholder="Write your research notes here..."
                  className="min-h-[400px] font-mono text-body-compact"
                />
              </Field>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => saveMutation.mutate(activeNote)}
                  disabled={!activeNote.title || saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Note'}
                </Button>
              </div>
              {saveMutation.isError && (
                <Notice tone="error" title="Error">
                  Failed to save note.
                </Notice>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-ink-subtle">
              Select a note from the left sidebar or create a new one.
            </div>
          )}
        </Panel>
      </div>
    </Page>
  )
}
