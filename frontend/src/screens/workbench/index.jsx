import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { http } from '@/api/http'
import { Button, Field, Input, Notice, Page, PageHeader, Panel, Textarea } from '@/ui/kit'
export function WorkbenchScreen() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    expression: '',
    description: '',
    idea: '',
    data_rationale: '',
    operator_rationale: '',
    tags: '',
  })
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        tags: data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }
      return await http.post('workbench/alphas', payload)
    },
    onSuccess: () => {
      navigate({ to: '/library' })
    },
  })
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.expression) return
    saveMutation.mutate(formData)
  }
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  return (
    <Page>
      <PageHeader
        title="Alpha Workbench"
        description="Draft your alpha ideas and document your rationale before running simulations."
        actions={
          <Button onClick={handleSubmit} disabled={!formData.expression || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save to Library'}
          </Button>
        }
      />

      {saveMutation.isError && (
        <Notice tone="error" title="Failed to save alpha">
          {saveMutation.error instanceof Error ? saveMutation.error.message : 'Unknown error'}
        </Notice>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Expression" description="The alpha formula using BRAIN syntax.">
            <Textarea
              name="expression"
              value={formData.expression}
              onChange={handleChange}
              placeholder="e.g. rank(ts_rank(close, 10))"
              className="font-mono h-48"
              required
            />
          </Panel>
          <Panel title="Idea & Description" description="High-level overview of this alpha.">
            <div className="flex flex-col gap-4">
              <Field label="Name (optional)">
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Mean Reversion 1"
                />
              </Field>
              <Field label="Core Idea">
                <Textarea
                  name="idea"
                  value={formData.idea}
                  onChange={handleChange}
                  placeholder="What is the financial premise?"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional context or notes..."
                />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Rationale" description="Why these datasets and operators?">
            <div className="flex flex-col gap-4">
              <Field label="Data Rationale">
                <Textarea
                  name="data_rationale"
                  value={formData.data_rationale}
                  onChange={handleChange}
                  placeholder="Why did you choose these data fields?"
                />
              </Field>
              <Field label="Operator Rationale">
                <Textarea
                  name="operator_rationale"
                  value={formData.operator_rationale}
                  onChange={handleChange}
                  placeholder="Why are these operators mathematically appropriate?"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Metadata">
            <Field label="Tags (comma-separated)">
              <Input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g. value, momentum, equities"
              />
            </Field>
          </Panel>
        </div>
      </div>
    </Page>
  )
}
