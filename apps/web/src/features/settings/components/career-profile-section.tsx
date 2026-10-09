import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  Layers,
  Briefcase,
  GraduationCap,
  ListChecks,
  Save,
} from 'lucide-react';
import { masterProfileApi } from '@/features/master-profile/api/master-profile-api';
import { ResumeUploadDropzone } from './resume-upload-dropzone';
import { MasterProfileDTO } from '@tracker/types';

export function CareerProfileSection() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['master-profile'],
    queryFn: masterProfileApi.getProfile,
  });

  const [formData, setFormData] = useState<MasterProfileDTO | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'basics' | 'rules' | 'experience' | 'projects' | 'skills' | 'education'>('basics');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: masterProfileApi.updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['master-profile'], updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleExportJson = async () => {
    try {
      const data = await masterProfileApi.exportJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master_resume_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        const { profile, warnings } = await masterProfileApi.importJson(json);
        setFormData((prev) => ({
          ...prev,
          ...profile,
          id: prev?.id || '',
          userId: prev?.userId || '',
          createdAt: prev?.createdAt || '',
          updatedAt: prev?.updatedAt || '',
        }));
        if (warnings.length > 0) {
          alert(`Draft loaded from JSON with warnings:\n• ${warnings.join('\n• ')}\n\nPlease review your Career Profile and click "Save Changes" to confirm.`);
        }
      } catch (err: any) {
        alert('Invalid JSON file format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({
      basics: formData.basics,
      positioningRules: formData.positioningRules || [],
      factBank: formData.factBank || {},
      summaryCandidates: formData.summaryCandidates || [],
      workExperience: (formData.workExperience || []).map((w) => ({
        ...w,
        bullets: w.bullets || [],
      })),
      projectExperience: (formData.projectExperience || []).map((p) => ({
        ...p,
        stack: p.stack || [],
        bullets: p.bullets || [],
      })),
      skills: formData.skills || {},
      education: (formData.education || []).map((e) => ({
        ...e,
        bullets: e.bullets || [],
      })),
      customSections: formData.customSections || [],
    });
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-primary/10 text-primary">
              <Sparkles size={16} />
            </span>
            <h2 className="font-display font-semibold text-heading text-foreground">
              Career Fact Bank & Profile
            </h2>
          </div>
          <p className="text-small text-muted-foreground">
            Your factual ground truth. The tailoring engine draws exclusively from these facts and positioning rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors">
            <Upload size={14} />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors"
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 1-Click Dropzone */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-subheading text-foreground mb-1">
          Upload Existing Resume
        </h3>
        <p className="text-caption text-muted-foreground mb-4">
          Drop your existing PDF or Word resume to automatically extract your experience, skills, and projects.
        </p>
        <ResumeUploadDropzone onSuccess={() => refetch()} />
      </div>

      {/* Visual Editor Tabs */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-border overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: 'basics', label: 'Contact Basics', icon: <FileText size={15} /> },
              { id: 'rules', label: 'Positioning Rules', icon: <Sparkles size={15} /> },
              { id: 'experience', label: 'Work Experience', icon: <Briefcase size={15} /> },
              { id: 'projects', label: 'Projects', icon: <Layers size={15} /> },
              { id: 'skills', label: 'Skills & Competencies', icon: <ListChecks size={15} /> },
              { id: 'education', label: 'Education', icon: <GraduationCap size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-small font-medium transition-colors cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-secondary text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium cursor-pointer transition-colors shrink-0 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="animate-spin" size={15} />
            ) : saveSuccess ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            <span>{saveSuccess ? 'Saved!' : 'Save Fact Bank'}</span>
          </button>
        </div>

        {/* Tab 1: Basics */}
        {activeSubTab === 'basics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.basics.name}
                  onChange={(e) =>
                    setFormData({ ...formData, basics: { ...formData.basics, name: e.target.value } })
                  }
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-small text-foreground focus-visible:outline-primary"
                />
              </div>
              <div>
                <label className="block text-caption font-medium text-foreground mb-1">Location</label>
                <input
                  type="text"
                  value={formData.basics.location || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, basics: { ...formData.basics, location: e.target.value } })
                  }
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-small text-foreground focus-visible:outline-primary"
                />
              </div>
              <div>
                <label className="block text-caption font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.basics.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, basics: { ...formData.basics, email: e.target.value } })
                  }
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-small text-foreground focus-visible:outline-primary"
                />
              </div>
              <div>
                <label className="block text-caption font-medium text-foreground mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.basics.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, basics: { ...formData.basics, phone: e.target.value } })
                  }
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-small text-foreground focus-visible:outline-primary"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption font-medium text-foreground">Links & Portfolios</span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      basics: {
                        ...formData.basics,
                        links: [...(formData.basics.links || []), { label: 'Portfolio', url: 'https://' }],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 text-caption text-primary hover:underline font-medium cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Link</span>
                </button>
              </div>

              {(formData.basics.links || []).map((link, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. GitHub)"
                    value={link.label}
                    onChange={(e) => {
                      const updated = [...formData.basics.links];
                      updated[idx].label = e.target.value;
                      setFormData({ ...formData, basics: { ...formData.basics, links: updated } });
                    }}
                    className="w-1/3 h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...formData.basics.links];
                      updated[idx].url = e.target.value;
                      setFormData({ ...formData, basics: { ...formData.basics, links: updated } });
                    }}
                    className="flex-1 h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.basics.links.filter((_, i) => i !== idx);
                      setFormData({ ...formData, basics: { ...formData.basics, links: updated } });
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Positioning Rules */}
        {activeSubTab === 'rules' && (
          <div className="space-y-4">
            <p className="text-caption text-muted-foreground">
              These guidelines instruct the tailoring engine how to position your experience and what to emphasize.
            </p>

            <div className="space-y-2">
              {(formData.positioningRules || []).map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const updated = [...formData.positioningRules];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, positioningRules: updated });
                    }}
                    className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.positioningRules.filter((_, i) => i !== idx);
                      setFormData({ ...formData, positioningRules: updated });
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  positioningRules: [...(formData.positioningRules || []), ''],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Add Positioning Rule</span>
            </button>
          </div>
        )}

        {/* Tab 3: Work Experience */}
        {activeSubTab === 'experience' && (
          <div className="space-y-6">
            {(formData.workExperience || []).map((exp, expIdx) => (
              <div key={expIdx} className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-body text-foreground">
                    Role #{expIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.workExperience.filter((_, i) => i !== expIdx);
                      setFormData({ ...formData, workExperience: updated });
                    }}
                    className="text-caption text-destructive hover:underline cursor-pointer"
                  >
                    Remove Role
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Company name"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...formData.workExperience];
                      updated[expIdx].company = e.target.value;
                      setFormData({ ...formData, workExperience: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Role title"
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...formData.workExperience];
                      updated[expIdx].role = e.target.value;
                      setFormData({ ...formData, workExperience: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Date range (e.g. Nov 2024 - Present)"
                    value={exp.date_range}
                    onChange={(e) => {
                      const updated = [...formData.workExperience];
                      updated[expIdx].date_range = e.target.value;
                      setFormData({ ...formData, workExperience: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={exp.location || ''}
                    onChange={(e) => {
                      const updated = [...formData.workExperience];
                      updated[expIdx].location = e.target.value;
                      setFormData({ ...formData, workExperience: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                </div>

                <div>
                  <span className="block text-caption font-medium text-foreground mb-1.5">
                    Achievement & Delivery Bullets:
                  </span>
                  {(exp.bullets || []).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2 mb-2">
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...formData.workExperience];
                          updated[expIdx].bullets[bIdx] = e.target.value;
                          setFormData({ ...formData, workExperience: updated });
                        }}
                        className="flex-1 p-2 rounded-md border border-input bg-background text-small text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.workExperience];
                          updated[expIdx].bullets = updated[expIdx].bullets.filter((_, i) => i !== bIdx);
                          setFormData({ ...formData, workExperience: updated });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer mt-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...formData.workExperience];
                      updated[expIdx].bullets.push('');
                      setFormData({ ...formData, workExperience: updated });
                    }}
                    className="inline-flex items-center gap-1 text-caption text-primary hover:underline cursor-pointer font-medium"
                  >
                    <Plus size={13} />
                    <span>Add Bullet</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  workExperience: [
                    ...formData.workExperience,
                    { company: '', role: '', date_range: '', bullets: [''] },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Add Work Experience</span>
            </button>
          </div>
        )}

        {/* Tab 4: Projects */}
        {activeSubTab === 'projects' && (
          <div className="space-y-6">
            {(formData.projectExperience || []).map((proj, pIdx) => (
              <div key={pIdx} className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-body text-foreground">
                    Project #{pIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.projectExperience.filter((_, i) => i !== pIdx);
                      setFormData({ ...formData, projectExperience: updated });
                    }}
                    className="text-caption text-destructive hover:underline cursor-pointer"
                  >
                    Remove Project
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = [...formData.projectExperience];
                      updated[pIdx].name = e.target.value;
                      setFormData({ ...formData, projectExperience: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle or domain"
                    value={proj.subtitle || ''}
                    onChange={(e) => {
                      const updated = [...formData.projectExperience];
                      updated[pIdx].subtitle = e.target.value;
                      setFormData({ ...formData, projectExperience: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                </div>

                <div>
                  <span className="block text-caption font-medium text-foreground mb-1.5">Project Bullets:</span>
                  {(proj.bullets || []).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2 mb-2">
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...formData.projectExperience];
                          updated[pIdx].bullets[bIdx] = e.target.value;
                          setFormData({ ...formData, projectExperience: updated });
                        }}
                        className="flex-1 p-2 rounded-md border border-input bg-background text-small text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.projectExperience];
                          updated[pIdx].bullets = updated[pIdx].bullets.filter((_, i) => i !== bIdx);
                          setFormData({ ...formData, projectExperience: updated });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer mt-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...formData.projectExperience];
                      updated[pIdx].bullets.push('');
                      setFormData({ ...formData, projectExperience: updated });
                    }}
                    className="inline-flex items-center gap-1 text-caption text-primary hover:underline cursor-pointer font-medium"
                  >
                    <Plus size={13} />
                    <span>Add Bullet</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  projectExperience: [
                    ...formData.projectExperience,
                    { name: '', subtitle: '', stack: [], bullets: [''] },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>
        )}

        {/* Tab 5: Skills & Competencies */}
        {activeSubTab === 'skills' && (
          <div className="space-y-4">
            {Object.entries(formData.skills || {}).map(([cat, skills], sIdx) => (
              <div key={sIdx} className="p-3.5 rounded-lg border border-border bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-small text-foreground">{cat}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...formData.skills };
                      delete updated[cat];
                      setFormData({ ...formData, skills: updated });
                    }}
                    className="text-caption text-destructive hover:underline cursor-pointer"
                  >
                    Delete Category
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Comma-separated items (e.g. React, TypeScript, Next.js)"
                  value={skills.join(', ')}
                  onChange={(e) => {
                    const items = e.target.value.split(',').map((s) => s.trim());
                    setFormData({
                      ...formData,
                      skills: {
                        ...formData.skills,
                        [cat]: items,
                      },
                    });
                  }}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const name = prompt('New Skill Category Name:');
                if (name && name.trim()) {
                  setFormData({
                    ...formData,
                    skills: {
                      ...formData.skills,
                      [name.trim()]: [],
                    },
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Add Skill Category</span>
            </button>
          </div>
        )}

        {/* Tab 6: Education */}
        {activeSubTab === 'education' && (
          <div className="space-y-4">
            {(formData.education || []).map((edu, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-body text-foreground">
                    Education #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.education.filter((_, i) => i !== idx);
                      setFormData({ ...formData, education: updated });
                    }}
                    className="text-caption text-destructive hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="School / University"
                    value={edu.school}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].school = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Degree (e.g. BS Computer Science)"
                    value={edu.degree || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].degree = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Graduation date (e.g. May 2024)"
                    value={edu.graduation || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].graduation = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Honors (e.g. With Honors)"
                    value={edu.honors || ''}
                    onChange={(e) => {
                      const updated = [...formData.education];
                      updated[idx].honors = e.target.value;
                      setFormData({ ...formData, education: updated });
                    }}
                    className="h-8 px-2.5 rounded-md border border-input bg-background text-small text-foreground"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  education: [
                    ...formData.education,
                    { school: '', degree: '', graduation: '' },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-secondary text-small font-medium text-foreground cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Add Education</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
