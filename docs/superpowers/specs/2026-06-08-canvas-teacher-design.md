# Canvas Teacher Design

## Purpose

`canvas-teacher` is a reference project for learning canvas editor engineering from the ground up. It mirrors the core technical direction of `ai-design-canvas`, but starts with a much smaller scope so each concept can be understood and hand-written in a separate student project.

The project is not connected to `apps/skywork-web` and does not depend on a backend in the first phase.

## Learning Method

Each lesson is intentionally small. A lesson introduces one canvas concept, implements one focused reference change in `canvas-teacher`, and gives the student a matching hand-writing task for `canvas-student`.

Every lesson follows this format:

1. Explain what the lesson is building.
2. Explain the canvas knowledge used in the lesson.
3. Implement the smallest reference change in `canvas-teacher`.
4. Commit the lesson as one Git commit.
5. Write a short lesson note under `docs/lessons`.
6. Give the student a hand-writing task and a small exercise.

## Change Tracking

Each lesson is committed separately. The student can inspect changes with:

```bash
git log --oneline
git show --stat HEAD
git show --patch HEAD
```

Lesson documents are stored in:

```text
docs/lessons/
```

Each lesson document includes:

- Lesson goal
- Knowledge points
- Changed files
- Key code explanation
- Student hand-writing task
- Common mistakes
- Small exercise

## Tech Stack

The reference project uses the same core stack direction as `ai-design-canvas`:

- React
- TypeScript
- Vite
- Konva
- MobX
- SCSS

The first phase does not include Vue wrapping, backend APIs, AI tools, remote material libraries, membership checks, or server-side annotation sync.

## Phase 1 Scope

Phase 1 focuses on the canvas core:

1. Create the project and install dependencies.
2. Render an empty Konva Stage.
3. Add a Layer.
4. Draw a fixed shape.
5. Read pointer coordinates.
6. Store one element in state.
7. Render the element from state.
8. Drag the element and sync position back to state.
9. Upload a local image.
10. Render a Konva Image.
11. Select an image.
12. Attach a Transformer to the selected image.
13. Scale the selected image and write size back to state.
14. Pan the canvas.
15. Zoom the canvas around the pointer.
16. Box select elements.
17. Multi-select elements.
18. Add a text element.
19. Edit text with a DOM overlay.
20. Delete selected elements.
21. Add undo and redo.
22. Save locally.
23. Export the canvas.

Large features can be split further if one lesson becomes too complex.

## Phase 1 Exclusions

The following features are intentionally delayed:

- AI background removal
- AI inpainting
- AI outpainting
- AI text editing
- Backend material library
- Backend annotations
- Knowledge base integration
- Cloud project persistence
- Vue SDK wrapper
- Permission and membership logic

## Repository Roles

The intended workspace layout is:

```text
/Users/fyy/Desktop/projects/canvas-teacher
/Users/fyy/Desktop/projects/canvas-student
```

`canvas-teacher` is the reference implementation. `canvas-student` is the student's hand-written project.

The teacher project should stay readable and explicit. Premature abstractions are avoided until the student has learned the underlying concept.

## First Implementation Step

The first code lesson is lesson 00: create a Vite React TypeScript project and install the core dependencies.

No canvas code is written before the project skeleton is understood.
