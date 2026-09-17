# Feature Phone Demo

A demo website optimized for feature phones with ultra-low resolution displays, built with Next.js and designed for QVGA (240×320) and QQVGA (160×120) screens.

*Created for the 2025 Meichu Hackathon.*

## Features

- **Ultra-low resolution support**: Optimized for QVGA (240×320) and QQVGA (160×120) displays
- **Feature phone navigation**: Keyboard mapping for 7 keys with visual feedback
- **Directional keypad**: Visual arrow keypad that responds to arrow keys
- **Visual feedback**: All navigation elements highlight when corresponding keys are pressed
- **Responsive design**: Font sizes and layouts automatically adjust for different screen sizes
- **Static export ready**: Pre-configured for GitHub Pages deployment

## Getting Started

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

### Building for Production

Build and export static files:

```bash
npm run build
```

Static files will be generated in the `out/` directory.

## Navigation Controls

### Navigation Bar (Bottom)
| Key | Action | Visual Indicator |
|-----|--------|------------------|
| Escape | Left button (SL) | Highlights L: SL |
| Enter | Center button | Highlights Enter |
| F12 | Right button (SR) | Highlights R: SR |

### Directional Keypad (Center)
| Key | Action | Visual Indicator |
|-----|--------|------------------|
| Arrow Up | Up navigation | Highlights ↑ button |
| Arrow Down | Down navigation | Highlights ↓ button |
| Arrow Left | Left navigation | Highlights ← button |
| Arrow Right | Right navigation | Highlights → button |

## Project Structure

- `app/page.tsx` - Main welcome page with keypad
- `app/components/Navigation.tsx` - Fixed bottom navigation bar
- `app/components/Keypad.tsx` - Visual directional keypad component
- `app/components/KeyboardHandler.tsx` - Global keyboard event management
- `app/components/NavigationContext.tsx` - State management for all button highlights
- `app/components/ClientLayout.tsx` - Client-side layout wrapper
- `app/globals.css` - Feature phone responsive breakpoints

## Deployment

### Automatic GitHub Actions
The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
- Builds the static site on pushes to main branch
- Deploys to `gh-pages` branch
- Requires Pages to be configured with Source: "Deploy from a branch" → `gh-pages`