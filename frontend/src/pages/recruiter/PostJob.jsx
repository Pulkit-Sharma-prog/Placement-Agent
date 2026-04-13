import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, X, ChevronRight, ChevronLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'

const BRANCHES = ['CSE', 'IT', 'ECE', 'ME', 'EE', 'Civil']

export default function PostJob() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState({
    title: '', location: '', ctc_min: '', ctc_max: '',
    description: '', required_skills: [], preferred_skills: [],
    min_cgpa: '', eligible_branches: [], graduation_year: new Date().getFullYear(),
    application_deadline: '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addSkill(type) {
    if (!skillInput.trim()) return
    const list = form[type]
    if (!list.includes(skillInput.trim())) {
      set(type, [...list, skillInput.trim()])
    }
    setSkillInput('')
  }

  function removeSkill(type, s) {
    set(type, form[type].filter(x => x !== s))
  }

  function toggleBranch(b) {
    const list = form.eligible_branches
    set('eligible_branches', list.includes(b) ? list.filter(x => x !== b) : [...list, b])
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await api.post('/jobs', {
        ...form,
        ctc_min: form.ctc_min ? parseInt(form.ctc_min) * 100000 : null,
        ctc_max: form.ctc_max ? parseInt(form.ctc_max) * 100000 : null,
        min_cgpa: form.min_cgpa ? parseFloat(form.min_cgpa) : null,
        graduation_year: parseInt(form.graduation_year),
      })
      toast.success('Job posted successfully!')
      navigate('/recruiter/jobs')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  function inputClass() {
    return {
      className: "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all",
      style: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      },
      onFocus: (e) => e.target.style.borderColor = 'var(--border-active)',
      onBlur:  (e) => e.target.style.borderColor = 'var(--border-subtle)',
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Post New Job</h1>

        {/* Step indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: step >= s ? 'var(--gradient-aurora)' : 'var(--bg-elevated)',
                  color: step >= s ? 'white' : 'var(--text-muted)',
                }}
              >
                {s}
              </div>
              {s < 3 && <div className="w-12 h-px" style={{ background: step > s ? 'var(--purple)' : 'var(--border-subtle)' }} />}
            </div>
          ))}
          <div className="flex items-center gap-4 ml-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            {['Basic Info', 'Requirements', 'Preview'][step - 1]}
          </div>
        </div>

        <div className="glass-card p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Basic Information</h2>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Job Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineer — Backend" {...inputClass()} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Location</label>
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bangalore" {...inputClass()} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>CTC Min (LPA)</label>
                  <input type="number" value={form.ctc_min} onChange={e => set('ctc_min', e.target.value)} placeholder="12" {...inputClass()} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>CTC Max (LPA)</label>
                  <input type="number" value={form.ctc_max} onChange={e => set('ctc_max', e.target.value)} placeholder="20" {...inputClass()} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Application Deadline</label>
                  <input type="date" value={form.application_deadline} onChange={e => set('application_deadline', e.target.value)} {...inputClass()} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Requirements</h2>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Job Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  {...inputClass()}
                />
              </div>
              {/* Skills */}
              {['required_skills', 'preferred_skills'].map(type => (
                <div key={type}>
                  <label className="text-xs mb-1.5 block capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {type.replace('_', ' ')}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSkill(type)}
                      placeholder="Type skill + Enter"
                      {...inputClass()}
                    />
                    <button onClick={() => addSkill(type)}
                      className="px-4 py-2 rounded-xl font-medium text-sm text-white"
                      style={{ background: 'var(--gradient-aurora)' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form[type].map(s => (
                      <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF' }}>
                        {s}
                        <button onClick={() => removeSkill(type, s)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Min CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" value={form.min_cgpa} onChange={e => set('min_cgpa', e.target.value)} placeholder="7.0" {...inputClass()} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Graduation Year</label>
                  <input type="number" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} {...inputClass()} />
                </div>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>Eligible Branches</label>
                <div className="flex flex-wrap gap-2">
                  {BRANCHES.map(b => (
                    <button key={b} onClick={() => toggleBranch(b)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: form.eligible_branches.includes(b) ? 'rgba(108,99,255,0.25)' : 'var(--bg-elevated)',
                        border: `1px solid ${form.eligible_branches.includes(b) ? 'rgba(108,99,255,0.5)' : 'var(--border-subtle)'}`,
                        color: form.eligible_branches.includes(b) ? '#6C63FF' : 'var(--text-secondary)',
                      }}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Preview</h2>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <h3 className="font-bold text-lg">{form.title || 'Job Title'}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {form.location} · ₹{form.ctc_min}–{form.ctc_max} LPA
                </p>
                <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                  {form.description || 'No description provided'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.required_skills.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF' }}>{s}</span>
                  ))}
                </div>
                <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Min CGPA: {form.min_cgpa} · Branches: {form.eligible_branches.join(', ') || 'All'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.title}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--gradient-aurora)' }}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--gradient-aurora)' }}>
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                Post Job
              </button>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
