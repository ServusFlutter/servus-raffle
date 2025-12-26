# Style Guide

## Design Reference

**Source**: `_bmad-output/ux-design-directions-final.html`

This interactive HTML mockup contains the complete visual design including:
- Participant views (light/dark modes)
- Wheel spinning view (projection screen)
- Celebration view (winner reveal with confetti)
- All participant journey states

Open the file in a browser to see interactive demos of wheel spinning and confetti effects.

## Color Palette

### Brand Colors

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| Primary | `--primary` | `#027DFD` | Main brand blue, buttons, links, CTAs |
| Primary Dark | `--primary-dark` | `#1E3A5F` | Headers, dark accents, wheel segments |
| Sky Blue | `--sky-blue` | `#54C5F8` | Light accents, ticket glow, wheel segments |
| Celebration | `--celebration` | `#F7DC6F` | Winner card, confetti, wheel pointer |
| Coral | `--coral` | `#E8A598` | Warm accents, confetti |
| Success | `--success` | `#22C55E` | Status indicators, confirmations |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Background Light | `#F5FAFB` | Page background (light mode) |
| Background Dark Start | `#0F172A` | Dark mode gradient start |
| Background Dark End | `#1E293B` | Dark mode gradient end |
| Text Primary (Dark) | `#F8FAFC` | Primary text on dark backgrounds |
| Text Secondary (Dark) | `#94A3B8` | Secondary/muted text on dark |
| Border Light | `#E5E7EB` | Borders, dividers (light mode) |
| Text Muted | `#6B7280` | Muted/disabled text |

## Typography

**Font Family**: Inter

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Google Fonts Import**:
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap
```

**Font Weights**:
| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, descriptions |
| 500 | Medium | Buttons, labels |
| 600 | Semibold | Subheadings, emphasis |
| 700 | Bold | Ticket numbers, headings, winner name |

## Gradients

### Light Mode Background (Participant)
```css
background: linear-gradient(135deg, #B8DDE9 0%, #54C5F8 50%, #027DFD 100%);
```

### Dark Mode Background (Participant)
```css
background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
```

### Wheel Segments
```css
background: conic-gradient(
  #1E3A5F 0deg 60deg,
  #027DFD 60deg 120deg,
  #54C5F8 120deg 180deg,
  #1E3A5F 180deg 240deg,
  #027DFD 240deg 300deg,
  #54C5F8 300deg 360deg
);
```

### Winner Card Radial Glow
```css
background: radial-gradient(circle at center, rgba(247, 220, 111, 0.15) 0%, transparent 60%);
```

## Component Patterns

### Ticket Circle

Large circular display for ticket count with glassmorphism effect.

**Light Mode**:
```css
background: rgba(255, 255, 255, 0.2);
border: 4px solid rgba(255, 255, 255, 0.4);
backdrop-filter: blur(10px);
```

**Dark Mode**:
```css
background: rgba(84, 197, 248, 0.1);
border: 3px solid rgba(84, 197, 248, 0.3);
box-shadow: 0 0 60px rgba(84, 197, 248, 0.3);
```

- Size: 200x200px (default), scales for mini views
- Number font: 96px bold
- Label: uppercase, letter-spacing 2px

### Status Bar

Bottom bar showing connection status.

```css
background: rgba(0, 0, 0, 0.2); /* Light mode */
background: rgba(0, 0, 0, 0.3); /* Dark mode */
backdrop-filter: blur(10px);
border-top: 1px solid rgba(255, 255, 255, 0.1); /* Dark mode only */
```

**Status Indicator**:
```css
width: 10px;
height: 10px;
background: #22C55E;
border-radius: 50%;
animation: pulse 2s infinite;
```

### Wheel

Projection view spinning wheel.

```css
box-shadow: 0 0 60px rgba(84, 197, 248, 0.4);
```

**Pointer**:
```css
border-left: 16px solid transparent;
border-right: 16px solid transparent;
border-top: 28px solid #F7DC6F; /* Celebration gold */
filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
```

**Center Button**:
```css
background: #0F172A;
border: 4px solid #54C5F8;
/* Hover: background changes to sky-blue, text to dark */
```

### Winner Card

Celebration display for winner announcement.

```css
background: #F7DC6F;
color: #1E3A5F;
padding: 48px 72px;
border-radius: 24px;
box-shadow: 0 0 100px rgba(247, 220, 111, 0.4);
```

- Winner name: 56px bold
- Label: 16px uppercase, letter-spacing 3px
- Ticket count: 24px semibold

## Animation

### Wheel Spin
```css
transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
```
- Duration: 5 seconds
- Rotation: ~5 full rotations (1800deg) plus seed offset

### Status Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
animation: pulse 2s infinite;
```

### Confetti
```javascript
confetti({
  particleCount: 150,
  spread: 70,
  colors: ['#F7DC6F', '#E8A598', '#027DFD', '#54C5F8'],
  disableForReducedMotion: true
});
```

## Accessibility

- All animations respect `prefers-reduced-motion`
- Minimum touch target: 48x48px
- Focus visible states on interactive elements
- Status indicator has text backup, not just color
