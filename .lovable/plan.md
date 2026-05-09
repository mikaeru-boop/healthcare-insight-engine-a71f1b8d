Remove the unused `AiPanelError` component and `AlertTriangle` import from `src/components/dashboard/ai-panel.tsx`.

### Changes
- Drop `AlertTriangle` from the `lucide-react` import (keep `Sparkles`).
- Delete the entire `AiPanelError` export (lines 69–100).

No other files reference `AiPanelError` (it was already removed from `src/routes/index.tsx` previously), so no other updates are needed.