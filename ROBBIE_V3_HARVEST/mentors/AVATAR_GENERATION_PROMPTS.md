# Mentor Avatar Generation Prompts

## Technical Specifications
- **Resolution**: 512x512 pixels (1:1 aspect ratio)
- **Format**: PNG with transparent background
- **Style**: Professional headshot, realistic, high-quality
- **Lighting**: Professional studio lighting, even and flattering
- **Head Size**: 60-70% of image height
- **Mood Variations**: 4 per mentor (confident, thoughtful, concerned, determined)

## Available Mentors
- **Steve Jobs** (1980s-2000s)
- **Winston Churchill** (1940s-1950s)
- **John Lennon** (1960s-1970s)
- **Albert Einstein** (1920s-1950s)
- **Julia Child** (1960s-1980s)
- **Elvis Presley** (1950s-1960s)

## Generation Instructions

### Using DALL-E 3
1. Copy the exact prompt for the desired mentor and mood
2. Use DALL-E 3 with the prompt
3. Generate 1024x1024 image
4. Resize to 512x512 pixels
5. Remove background and make transparent
6. Save as PNG

### Using Midjourney
1. Copy the exact prompt for the desired mentor and mood
2. Use Midjourney with the prompt
3. Generate high-resolution image
4. Resize to 512x512 pixels
5. Remove background and make transparent
6. Save as PNG

### Using Stable Diffusion
1. Copy the exact prompt for the desired mentor and mood
2. Use Stable Diffusion with the prompt
3. Set resolution to 512x512
4. Generate with high quality settings
5. Remove background and make transparent
6. Save as PNG

## Quality Checklist
- [ ] 512x512 pixel resolution
- [ ] Transparent background
- [ ] Professional headshot style
- [ ] Consistent lighting across all avatars
- [ ] High quality and detailed
- [ ] Appropriate mood expression
- [ ] Mentor characteristics clearly visible
- [ ] PNG format

## File Organization
```
docs/characters/mentors/
├── steve_jobs/
│   ├── steve_jobs-confident.png
│   ├── steve_jobs-thoughtful.png
│   ├── steve_jobs-concerned.png
│   └── steve_jobs-determined.png
├── winston_churchill/
│   ├── winston_churchill-confident.png
│   ├── winston_churchill-thoughtful.png
│   ├── winston_churchill-concerned.png
│   └── winston_churchill-determined.png
└── [other mentors...]
```
