# Phase 10.6 — Report Dark Mode Fix

This patch corrects the Reports module preview when the website is in Dark Mode.

## Problem
Global dark-theme table and text styles were affecting the white report preview canvas, causing very low contrast in table headers, body rows, and summary text.

## Fix
The report preview now uses explicit print-style colors regardless of the application theme:

- white paper background
- dark text
- readable table header background
- readable report statistics cards
- readable signature/footer text

## Files changed
- `frontend/css/style.css`

## Deployment
Copy the updated `frontend/css/style.css` into your project, then commit and push to GitHub so Vercel redeploys the frontend.
