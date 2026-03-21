"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { CustomSection } from '@/types';

interface Props {
    customSections: CustomSection[];
    setCustomSections: React.Dispatch<React.SetStateAction<CustomSection[]>>;
    syncArray: (column: string, array: any[]) => Promise<void>;
    user: any;
}

export default function CustomSectionsEditor({ customSections, setCustomSections, syncArray, user }: Props) {

    const handleAddSection = () => {
        const newSection: CustomSection = {
            id: `cs-${Date.now()}`,
            userProfileId: user?.id || '',
            sectionTitle: 'New Section',
            items: [],
            order: customSections.length
        };
        const next = [...customSections, newSection];
        setCustomSections(next);
        syncArray('custom_sections', next);
    };

    const handleDeleteSection = (sectionId: string) => {
        const next = customSections.filter(s => s.id !== sectionId);
        setCustomSections(next);
        syncArray('custom_sections', next);
    };

    const handleTitleChange = (sectionId: string, newTitle: string) => {
        setCustomSections(prev => prev.map(s => s.id === sectionId ? { ...s, sectionTitle: newTitle } : s));
    };

    const handleAddItem = (sectionId: string) => {
        const newItem = { id: `cs-item-${Date.now()}`, title: '', subtitle: '', description: '', date: '' };
        setCustomSections(prev => {
            const next = prev.map(s => s.id === sectionId ? { ...s, items: [...(s.items || []), newItem] } : s);
            syncArray('custom_sections', next);
            return next;
        });
    };

    const handleDeleteItem = (sectionId: string, itemId: string) => {
        setCustomSections(prev => {
            const next = prev.map(s => s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s);
            syncArray('custom_sections', next);
            return next;
        });
    };

    const handleItemChange = (sectionId: string, itemId: string, field: string, value: string) => {
        setCustomSections(prev => prev.map(s => {
            if (s.id === sectionId) {
                return { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) };
            }
            return s;
        }));
    };

    const flushSync = () => {
        syncArray('custom_sections', customSections);
    };

    return (
        <div className="space-y-6">
            {customSections.map((section) => (
                <Card key={section.id} className="shadow-sm border-primary/20 bg-background/50">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <Input 
                                value={section.sectionTitle} 
                                onChange={(e) => handleTitleChange(section.id, e.target.value)} 
                                onBlur={flushSync}
                                className="h-8 font-semibold text-base border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary w-1/2 p-1"
                                placeholder="Section Title (e.g. Publications)"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAddItem(section.id)}>
                                    <PlusCircle className="mr-1 h-3 w-3" /> Add Item
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteSection(section.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(!section.items || section.items.length === 0) && (
                                <p className="text-xs text-muted-foreground italic px-2">No items in this section. Add one to get started.</p>
                            )}
                            {section.items?.map(item => (
                                <div key={item.id} className="border rounded-lg p-3 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-2">
                                            <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                <Input name="title" placeholder="Item Name (e.g. Winner, Top 10)" value={item.title} onChange={(e) => handleItemChange(section.id, item.id, 'title', e.target.value)} onBlur={flushSync} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                <Input name="subtitle" placeholder="Subtitle / Role / Details" value={item.subtitle || ''} onChange={(e) => handleItemChange(section.id, item.id, 'subtitle', e.target.value)} onBlur={flushSync} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                <Input name="date" placeholder="Date (e.g. 2024)" value={item.date || ''} onChange={(e) => handleItemChange(section.id, item.id, 'date', e.target.value)} onBlur={flushSync} className="col-span-2 md:col-span-4 h-8 text-sm" />
                                            </div>
                                            <Textarea name="description" placeholder="Describe the achievement..." value={item.description || ''} onChange={(e) => handleItemChange(section.id, item.id, 'description', e.target.value)} onBlur={flushSync} rows={2} className="text-sm resize-none" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10 group" onClick={() => handleDeleteItem(section.id, item.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button variant="outline" className="w-full border-dashed py-8 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20" onClick={handleAddSection}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Completely Custom Section
            </Button>
        </div>
    );
}
