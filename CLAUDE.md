# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a feature phone demo website built with Next.js for the 2025 Meichu Hackathon, specifically designed to support low-resolution displays:
- QVGA: 240x320 pixels
- QQVGA: 160x120 pixels

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build and export static files to `out/` directory
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Key Components

- `app/components/Navigation.tsx` - Fixed bottom navigation bar with L/R/Center buttons
- `app/components/Keypad.tsx` - Visual directional keypad (↑↓←→) 
- `app/components/KeyboardHandler.tsx` - Global keyboard event management
- `app/components/NavigationContext.tsx` - React context for button highlight states
- `app/components/ClientLayout.tsx` - Client-side layout wrapper
- `app/layout.tsx` - Root layout with NavigationProvider
- `app/page.tsx` - Welcome page with title, description, and keypad
- `app/globals.css` - Feature phone responsive breakpoints

### Keyboard Navigation System

The website implements comprehensive keyboard navigation with visual feedback:

**Navigation Bar (Bottom):**
- Escape key → "L: SL" (left button)
- Enter key → "Enter" (center button) 
- F12 key → "R: SR" (right button)

**Directional Keypad (Center):**
- Arrow Up → ↑ button
- Arrow Down → ↓ button  
- Arrow Left → ← button
- Arrow Right → → button

All keys prevent default browser behavior and provide 200ms yellow highlight feedback.

### Feature Phone Optimization

- CSS breakpoints at 320px, 240px, and 160px widths
- Font sizes scale down for smaller screens (12px, 10px, 8px)
- Container max-width constraints for different resolutions
- Cross-shaped keypad layout for directional navigation
- Minimal, centered design optimized for tiny screens

### Static Export Configuration

- Configured for GitHub Pages deployment with repository base path
- Conditional `basePath` and `assetPrefix` for production builds
- Automatic deployment via GitHub Actions workflow
- Static files generated in `out/` directory

## Deployment

The project uses GitHub Actions (`.github/workflows/deploy.yml`) for automatic deployment:
- Triggers on pushes to main branch
- Builds static export with production environment
- Deploys to `gh-pages` branch automatically
- Repository must have Pages configured to deploy from `gh-pages` branch