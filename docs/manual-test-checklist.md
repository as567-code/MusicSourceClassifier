# Manual Test Checklist

- Human demo sample routes from `/` to `/analyze` and then to `/results/human`.
- AI demo sample routes from `/` to `/analyze` and then to `/results/ai`.
- Invalid file upload produces a clear failure or recovery state.
- `/analyze` retry flow works after a failed request.
- Refreshing `/results/:type` restores the latest validated analysis payload from session storage.
- The results page stays readable at a 390px mobile viewport.

## Environment Note

- A live end-to-end browser smoke test still requires a Python 3.11 runtime with the ML dependencies installed (`torch`, `torchaudio`, and related backend packages).
- The current local `venv` is Python 3.14 without `torch`, so backend boot verification is blocked in this environment even though the automated backend/frontend test suites and frontend production build pass.
