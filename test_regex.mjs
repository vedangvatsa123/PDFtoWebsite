function test(title) {
  let clean = title.replace(/(?:\s+[-–]\s*|\s*[-–]\s+|—|\|).*$/, '');
  console.log(`"${title}" -> "${clean.trim()}"`);
}
test("Director of Brand & Social | Poppy & Peonies");
test("Registered Dietitian- FL Licensed");
test("Software Engineer - Backend");
test("Full-Stack Developer");
test("Co-founder");
test("Director|Sales");
test("E-commerce");
test("Software Engineer—Backend");
