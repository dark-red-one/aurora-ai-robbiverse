# Cursor Rules Configuration

Modern, maintainable configuration for Robbie's development standards at TestPilot CPG.

## Structure Overview

```
.cursor/
├── index.mdc                    # Main project rules (always loaded)
├── README.md                    # This file
├── docs/                        # System architecture (reference material)
│   ├── ai-personality-system.mdc
│   ├── gpu-mesh-architecture.mdc
│   ├── memory-persistence-model.mdc
│   └── risk-assessment-model.mdc
├── rules/                       # Code guidelines (context-aware)
│   ├── browser-testing-guidelines.mdc
│   ├── core/                    # Core code quality standards
│   ├── tech-stack/              # Technology-specific patterns
│   │   ├── python-fastapi.mdc
│   │   └── react-typescript.mdc
│   ├── workflows/               # Development processes
│   │   ├── git-commits.mdc
│   │   └── debugging.mdc
│   └── testing/                 # Testing standards
└── modes/                       # Specialized interaction modes
    ├── planner.mdc              # Planning & architecture mode
    └── executor.mdc             # Implementation mode
```

---

## How It Works

### Automatic Loading

**Always Active:**

- `index.mdc` - Core philosophy, communication style, project context

**Context-Aware (loaded by glob patterns):**

- `python-fastapi.mdc` - When editing `.py` files
- `react-typescript.mdc` - When editing `.tsx`, `.ts` files
- `git-commits.mdc` - When committing changes
- `debugging.mdc` - When troubleshooting issues

**Reference Material:**

- `docs/*.mdc` - Loaded when relevant via `@docs/filename`

**Special Modes:**

- `modes/planner.mdc` - Invoke with `@planner`
- `modes/executor.mdc` - Invoke with `@executor`

---

## Usage Guide

### Daily Development

Just code normally. Rules load automatically based on file type:

- Editing Python → Python/FastAPI standards active
- Editing React → React/TypeScript standards active
- Committing → Git commit standards active

### Reference Architecture

Need to understand system design?

```
@docs/ai-personality-system    # 6-mood emotional system
@docs/gpu-mesh-architecture    # Distributed GPU processing
@docs/memory-persistence-model # Vector-based memory
@docs/risk-assessment-model    # Business risk tracking
```

### Planning a Feature

For complex changes, use Planner Mode:

```
@planner How should I implement mood history tracking?
```

Robbie will:

1. Ask clarifying questions
2. Analyze current state
3. Propose 2-3 approaches
4. Create detailed plan with tasks
5. Wait for your approval

### Executing a Plan

Once plan is approved, switch to Executor Mode:

```
@executor Start implementing the plan
```

Robbie will:

1. Read plan.md
2. Implement one task at a time
3. Test after each task
4. Wait for "go" between tasks
5. Stop if hitting circuit breakers

---

## File Organization

### What Goes Where

**`index.mdc`** - Core philosophy and context

- Development philosophy (ship fast, revenue-first)
- System architecture overview
- Tech stack specifics
- Critical active issues
- Communication style
- Revenue lens questions

**`rules/tech-stack/`** - Implementation patterns

- Language-specific conventions
- Framework best practices
- Error handling examples
- Performance patterns

**`rules/workflows/`** - Development processes

- Git workflow
- Debugging approach
- Code review standards
- Testing strategies

**`docs/`** - System architecture

- Business logic specifications
- Technical architecture details
- System design documents
- Integration patterns

**`modes/`** - Specialized behaviors

- Planner: Think before coding
- Executor: Follow plan exactly

---

## Maintenance Guidelines

### Adding New Rules

1. **Determine Category**
   - Code guideline → `rules/`
   - Architecture doc → `docs/`
   - Process → `workflows/`
   - Mode → `modes/`

2. **Keep Rules Focused**
   - One concern per file
   - Under 300 lines
   - Use concrete examples
   - Link to related rules

3. **Use Glob Patterns**

   ```yaml
   ---
   description: "Brief description"
   globs: ["**/*.py", "specific/path/**/*"]
   alwaysApply: false
   ---
   ```

4. **Test the Rule**
   - Edit relevant file type
   - Verify rule loads
   - Check for conflicts

### Updating Existing Rules

1. **Preserve Structure**
   - Keep frontmatter format
   - Maintain section headings
   - Update examples

2. **Document Changes**
   - Note what changed in commit message
   - Update last modified date if present

3. **Verify No Breakage**
   - Rules should complement, not conflict
   - Test with various file types

### Removing Outdated Rules

1. **Don't Delete Immediately**
   - Move to `rules/deprecated/`
   - Add deprecation note
   - Remove after 1 week if no issues

---

## Best Practices

### For Rule Files

✅ **Do:**

- Use concrete examples over abstract descriptions
- Include both good and bad patterns
- Explain the "why" not just "what"
- Reference existing codebase patterns
- Keep language clear and direct

❌ **Don't:**

- Create overlapping rules (consolidate instead)
- Use vague language ("should consider", "might want to")
- Write rules longer than 300 lines
- Include placeholder content
- Duplicate content across files

### For Glob Patterns

✅ **Do:**

- Be specific: `**/*.py` for Python files
- Use multiple patterns when needed: `["**/*.tsx", "**/*.ts"]`
- Target directories for broad application: `packages/@robbieverse/api/**/*`

❌ **Don't:**

- Use `**/*` (too broad, loads for everything)
- Overlap patterns unnecessarily
- Create rules that always apply (use `index.mdc` instead)

---

## Troubleshooting

### Rule Not Loading

**Symptom:** Robbie doesn't follow expected patterns

**Solutions:**

1. Check glob pattern matches your file
2. Verify `alwaysApply` setting
3. Look for conflicting rules
4. Try explicitly: `@ruleName`

### Too Many Rules Loading

**Symptom:** Responses too verbose or conflicting advice

**Solutions:**

1. Narrow glob patterns
2. Set `alwaysApply: false` on specialized rules
3. Consolidate overlapping rules
4. Move reference material to `docs/`

### Rules Conflict

**Symptom:** Contradictory guidance

**Solutions:**

1. Check which rules apply to current file
2. Prioritize: `index.mdc` > `tech-stack` > `workflows`
3. Consolidate into single rule
4. Add resolution note to both files

---

## Migration History

**October 11, 2025:**

- Migrated from flat `.cursorrules` file
- Created directory structure with categories
- Separated architecture docs from code guidelines
- Added specialized modes (planner/executor)
- Strategic merge of personality content into `index.mdc`

**Legacy File:**

- `.cursorrules.legacy` - Original configuration (archived)
- `rules/robbie-cursor-personality.mdc` - Removed (content merged into `index.mdc`)

---

## Quick Reference

### Common Commands

```bash
# Reference architecture docs
@docs/ai-personality-system

# Invoke planning mode
@planner Should I...

# Invoke execution mode
@executor Implement the plan

# Reference specific rule
@python-fastapi
@react-typescript
@git-commits
@debugging
```

### File Shortcuts

- `index.mdc` - Core standards (always active)
- `python-fastapi.mdc` - Python/FastAPI patterns
- `react-typescript.mdc` - React/TypeScript patterns
- `git-commits.mdc` - Commit message format
- `debugging.mdc` - Problem-solving approach

---

## Philosophy

These rules exist to:

1. **Speed up development** - Consistent patterns, less debate
2. **Maintain quality** - Standards enforced automatically
3. **Scale knowledge** - Best practices codified
4. **Ship faster** - Clear guidance, less overthinking

Rules should **accelerate shipping**, not slow it down. If a rule makes development harder, it's wrong and should be changed.

**Ship fast. Think revenue-first. Challenge scope creep. Build for scale.** 🚀

---

Last Updated: October 11, 2025
Maintained by: Robbie (with Allan's oversight)
