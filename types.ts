export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface TransformationConfig {
  styleStrength: 'subtle' | 'balanced' | 'intense';
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

export const MANGA_PROMPT = `Transform this realistic image into a high-quality Japanese Manga/Anime style illustration.

STRICT VISUAL REQUIREMENTS:
1. **Background**: The result MUST have a completely PLAIN WHITE background (#FFFFFF). Remove any original background scenery.
2. **Line Art (CRITICAL)**:
   - **THICK, BOLD BLACK OUTLINES**: Use strong, heavy ink strokes for the character contours.
   - The style should resemble high-contrast manga inking. Do not use thin, sketchy, or faint lines.
3. **Pose & Framing (CRITICAL)**:
   - **STRICTLY maintain the exact original pose** and camera angle.
   - **NO FLOATING BODIES**: The character must extend all the way to the bottom edge of the image, just like the original photo.
   - **Do NOT leave empty white space at the bottom**. If the original image cuts off at the thighs, the manga version must also cut off at the exact same point at the bottom edge, filling the canvas vertically.
   - **FULL FRAME**: Scale the character so that the head fits at the top and the legs/body extend to the bottom edge as per the original. Do not zoom in too much.
4. **Proportions**:
   - Make the HEAD slightly LARGER (anime style), but adjust the body scale so that the figure still fills the frame to the bottom.
5. **Female Body Stylization**: If the subject is a woman, strictly apply a stylized "Hourglass" body shape:
   - Significantly emphasize the chest/bust (Large).
   - Make the stomach/waist very small and slim.
   - Emphasize wide hips and a large, curved bottom.
6. **Image Quality**: 
   - High Resolution, Sharp Details (4K aesthetic).
   - Clean, solid colors with cel-shading.
   - Output must look like a high-quality PNG export from digital art software.`;