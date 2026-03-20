# **App Name**: TITRATE

## Core Features:

- Anki File Import & Data Storage: Efficiently import Anki files (.apkg/CSV/TXT) with MCQs, choices, correct answers, and rationales into client-side IndexedDB, structured to emulate a SQLite schema, handling large datasets without UI freeze.
- User Profile & Progress Tracking: Store and manage user profiles, including target board ratings, and track performance metrics from quizzes to inform the spaced repetition system and personalized study recommendations.
- Local SM-2 Spaced Repetition: Implement a basic SM-2 algorithm entirely client-side using locally stored 'Ease Factors' within IndexedDB to optimally schedule review times for individual questions, maximizing learning efficiency.
- AI Study Block & Exam Scheduler: An AI-powered tool that analyzes the user's defined 'Class Schedules' and dynamically suggests optimal 30-minute 'High-Yield' study blocks in available gaps. It also features a visible countdown timer to the locally stored 'Board Exam Date'.
- Spotify-Style Study Dashboard: A high-end, dark-themed home dashboard inspired by the Spotify interface, dynamically featuring sections like 'Recently Reviewed Subjects' and an intelligent 'Weakest Subjects Mix' based on user performance.
- Timed Study Reminders: Provide local, browser-based notifications to alert users about upcoming study blocks and crucial exam deadlines, integrated seamlessly with the Smart Study Scheduler.

## Style Guidelines:

- Color scheme: Dark theme, reflecting a sophisticated, focused, and high-end MedTech study environment. The overall ambiance should evoke a professional 'library' feel.
- Primary color: A clear, vibrant blue (#54C3FF). This hue is chosen to convey precision and professionalism, providing strong contrast against the dark background.
- Background color: A deep, rich charcoal with a subtle blue undertone (#1A1E22). This ensures an elegant dark mode experience consistent with the primary color's hue.
- Accent color: A vibrant blue-violet (#6464FF). This analogous color provides dynamic highlights for interactive elements and key information, maintaining visual harmony while offering distinction.
- State colors: Utilize a bold orange (#FF8000) for 'Bio-hazard Orange' indicators (e.g., warnings or critical feedback) and a vivid purple (#A130F7) for 'Lab Purple' status (e.g., 'Correct' answers or success indicators).
- Headline font: 'Alegreya' (serif). Chosen for an elegant, intellectual, and contemporary feel that supports the 'library' aesthetic.
- Body text font: 'Inter' (sans-serif). Recommended for its modern, objective, and neutral characteristics, ensuring optimal readability and a high-contrast experience on dark backgrounds.
- Employ subtle, refined icons with clear visual metaphors related to medical technology, study, and scheduling. Icons should align with the high-end dark theme without being overly clinical or decorative.
- Adopt a 'Spotify-inspired' layout with smooth, card-based navigation and visual hierarchy. The Home Dashboard will present information in organized, intuitive blocks, reminiscent of streaming service interfaces for effortless browsing of study content.
- Incorporate subtle, smooth transition animations for navigation and state changes, contributing to a premium, fluid user experience without distracting from critical study material.