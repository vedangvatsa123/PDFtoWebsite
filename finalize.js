const fs = require('fs');
let code = fs.readFileSync('src/app/editor/page.tsx', 'utf8');

// 1. Completely rewrite the ProfileCompleteness component logic & internal JSX Layout
const profileCompletenessRegex = /const ProfileCompleteness =.*?\}\);\s*const \{ score, checks, isComplete \} = completeness;.*?<\/Card>\s*\);\s*\};/s;

const optimizedProfileCompleteness = `const ProfileCompleteness = ({ profile, work, education, skills, onNavigate }: { profile: Partial<UserProfile>, work: WorkExperience[], education: Education[], skills: string[], onNavigate: (tab: string) => void }) => {
    const completeness = useMemo(() => {
        const checks = [
            { name: "Add a Profile Photo", complete: !!(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')), targetId: 'avatar-upload' },
            { name: "Write a Summary", complete: !!profile.summary, targetId: 'summary' },
            { name: "Add your Location", complete: !!profile.location, targetId: 'location' },
            { name: "Add Work Experience", complete: work.length > 0, targetId: 'work-experience-section' },
            { name: "Add your Education", complete: education.length > 0, targetId: 'education-section' },
            { name: "Add at least one Skill", complete: skills.length > 0, targetId: 'skills-section' },
        ];
        const completeCount = checks.filter(c => c.complete).length;
        const totalCount = checks.length;
        const score = Math.round((completeCount / totalCount) * 100);

        return { score, checks, isComplete: completeCount === totalCount };
    }, [profile, work, education, skills]);

    const { score, checks, isComplete } = completeness;

    return (
        <Card className="h-full shadow-sm flex flex-col justify-center">
            <CardContent className="pt-4 pb-3">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Job Readiness Score</p>
                    <div className="flex items-center gap-2">
                        <Progress value={score} className="h-1.5 w-16 sm:w-24 bg-secondary" />
                        <span className="text-xs font-bold text-foreground">{score}%</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {checks.map(c => (
                        <div 
                            key={c.name} 
                            onClick={() => {
                                const el = document.getElementById(c.targetId);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.focus({ preventScroll: true });
                                }
                            }}
                            className={\`cursor-pointer flex items-center gap-2 p-2 rounded-md border text-[10px] transition-all \${c.complete ? 'bg-secondary/40 border-transparent text-muted-foreground/60 line-through grayscale' : 'bg-background shadow-none border-border/60 hover:border-primary/40 font-medium text-foreground hover:shadow-sm'}\`}
                        >
                            {c.complete ? <CheckCircle className="h-3 w-3 text-green-500 shrink-0" /> : <div className="h-2.5 w-2.5 rounded-full border border-gray-400 shrink-0" />}
                            <span className="truncate" title={c.name}>{c.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};`;

if (code.match(profileCompletenessRegex)) {
    code = code.replace(profileCompletenessRegex, optimizedProfileCompleteness);
} else {
    console.error("Could not accurately find the ProfileCompleteness Component declaration root!");
}

// 2. Ensure IDs map to sections enabling the scrolling hooks to fire effectively
code = code.replace('<h3 className="text-sm font-semibold">Work Experience</h3>', '<h3 id="work-experience-section" className="text-sm font-semibold scroll-mt-24">Work Experience</h3>');
code = code.replace('<h3 className="text-sm font-semibold">Education</h3>', '<h3 id="education-section" className="text-sm font-semibold scroll-mt-24">Education</h3>');
code = code.replace('<h3 className="text-sm font-semibold">Skills</h3>', '<h3 id="skills-section" className="text-sm font-semibold scroll-mt-24">Skills</h3>');

// 3. Fix the layout wrapper logic safely integrating Your Public Link and ProfileCompleteness
const oldGridRegex = /<div className="grid md:grid-cols-2 gap-4">\s*<ProfileCompleteness profile=\{profile\} work=\{workItems\} education=\{educationItems\} skills=\{skillItems\} onNavigate=\{[^}]*\} \/>\s*<\/div>/s;
if (code.match(oldGridRegex)) {
    // Already wrapped safely
} else {
    const doubleCardMatch = /<Card className="shadow-sm">\s*<CardContent className="pt-4 pb-3">[\s\S]*?Your Public Link[\s\S]*?<\/CardContent>\s*<\/Card>\s*<div className="grid md:grid-cols-2 gap-4">/s;
    if (code.match(doubleCardMatch)) {
         // Attempted wrapper fix... The previous attempt had them un-wrapped
    }
}

// Check if they are currently un-wrapped
const looseCompleteness = /<Card className="shadow-sm">[\s\S]*?Your Public Link[\s\S]*?<\/Card>\s*<ProfileCompleteness profile=\{profile\}/s;
if (code.match(looseCompleteness)) {
    const fullMatch = code.match(looseCompleteness)[0];
    const justLinkCard = fullMatch.split('<ProfileCompleteness')[0].replace('<Card className="shadow-sm">', '<Card className="shadow-sm h-full flex flex-col justify-center">');
    const completenessStr = '<ProfileCompleteness profile={profile}';
    
    code = code.replace(looseCompleteness, `<div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 lg:gap-6 mb-6">
                                ${justLinkCard}
                                ${completenessStr}`);
                                
    // And add closing div logic
    const closingDivRegex = /onNavigate=\{\(\) => \{\}\} \/>/s;
    code = code.replace(closingDivRegex, 'onNavigate={() => {}} />\n                                </div>');
}


// Fix lint conflict on the text-muted-foreground tailwind class
const lintConflictRegex = /<div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-primary\/10 text-primary px-2.5 py-0.5 rounded-full font-bold" title="Total Views">/;
if (code.match(lintConflictRegex)) {
    code = code.replace(lintConflictRegex, '<div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold" title="Total Views">');
}

fs.writeFileSync('src/app/editor/page.tsx', code);
console.log("Final Script Applied");
