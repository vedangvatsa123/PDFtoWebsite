const fs = require('fs');

// 1. Update Preview Template for Education Description
let templateCode = fs.readFileSync('src/app/[slug]/templates/modern-creative.tsx', 'utf8');
const oldEduMapping = `                      <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{edu.institution}</h3>
                          <p className="text-xs text-muted-foreground">{edu.degree}</p>
                        </div>
                        <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                          {edu.startDate} — {edu.endDate || 'Present'}
                        </span>
                      </div>`;

const newEduMapping = `                      <div key={edu.id}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{edu.institution}</h3>
                            <p className="text-xs text-muted-foreground">{edu.degree}</p>
                          </div>
                          <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                            {edu.startDate} — {edu.endDate || 'Present'}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {edu.description}
                          </p>
                        )}
                      </div>`;
templateCode = templateCode.replace(oldEduMapping, newEduMapping);
fs.writeFileSync('src/app/[slug]/templates/modern-creative.tsx', templateCode);


// 2. Refactor Editor Logic and Arrays
let code = fs.readFileSync('src/app/editor/page.tsx', 'utf8');

// Strip out placeholders
code = code.replace(/placeholder="Start \(Jan 20\d\d\)"/g, 'placeholder="Start"');
code = code.replace(/placeholder="End \(Present\)"/g, 'placeholder="End"');
code = code.replace(/placeholder="Start"/g, 'placeholder="Start"'); // ensure mapped cleanly

// Map the Trash block architecture structurally into a flex companion layout!
// For Work Experience:
const oldWorkBlock = `<div key={item.id} className="border rounded-lg p-3 pr-10 relative space-y-2 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-3 right-2 hover:bg-destructive/10 group" onClick={() => handleDeleteItem('workExperience', item.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive transition-colors"/></Button>
                                            <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                <Input name="title" placeholder="Title" value={item.title} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                <Input name="company" placeholder="Company" value={item.company} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                            </div>
                                            <Textarea name="description" placeholder="Describe your responsibilities and achievements..." value={item.description} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} rows={2} className="text-sm resize-none" />
                                        </div>`;

const newWorkBlock = `<div key={item.id} className="border rounded-lg p-3 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                            <div className="flex gap-2 items-start">
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                        <Input name="title" placeholder="Title" value={item.title} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="company" placeholder="Company" value={item.company} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                        <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                    </div>
                                                    <Textarea name="description" placeholder="Describe your responsibilities and achievements..." value={item.description} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} rows={2} className="text-sm resize-none" />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10 group" onClick={() => handleDeleteItem('workExperience', item.id)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors"/>
                                                </Button>
                                            </div>
                                        </div>`;

code = code.replace(oldWorkBlock, newWorkBlock);

// For Education:
const oldEduBlock = `<div key={item.id} className="border rounded-lg p-3 pr-10 relative space-y-2 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-3 right-2 hover:bg-destructive/10 group" onClick={() => handleDeleteItem('education', item.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive transition-colors"/></Button>
                                            <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                <Input name="institution" placeholder="Institution" value={item.institution} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                <Input name="degree" placeholder="Degree" value={item.degree} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                            </div>
                                        </div>`;

const newEduBlock = `<div key={item.id} className="border rounded-lg p-3 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                            <div className="flex gap-2 items-start">
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                        <Input name="institution" placeholder="Institution" value={item.institution} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="degree" placeholder="Degree" value={item.degree} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                        <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                    </div>
                                                    <Textarea name="description" placeholder="Describe your studies, honors, or extracurricular achievements..." value={item.description || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} rows={2} className="text-sm resize-none" />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10 group" onClick={() => handleDeleteItem('education', item.id)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors"/>
                                                </Button>
                                            </div>
                                        </div>`;

code = code.replace(oldEduBlock, newEduBlock);

fs.writeFileSync('src/app/editor/page.tsx', code);
console.log("Refactoring complete");
