# AlphaForge

**Personal Quant Research Platform**

AlphaForge is a personal quantitative research platform designed for WorldQuant BRAIN alpha development, experimentation, analysis, and research management. It acts as a comprehensive, local-first research terminal, allowing researchers to go from an initial hypothesis to a fully simulated and documented alpha without leaving the application.

## 1. Overview
AlphaForge provides a clean, information-dense, dark-first research environment. It deeply integrates with the WorldQuant BRAIN platform while prioritizing local data persistence, reproducibility, and a fast, developer-friendly interface.

## 2. Features
- **Alpha Workbench**: A powerful, syntax-friendly editor for authoring and formatting alpha expressions.
- **Data & Operator Explorer**: Searchable, categorised local catalog of all available fields and operators.
- **Experiment Tracking**: Capture hypotheses, datasets, simulation results, and iterative next steps.
- **Alpha Library**: Sort, filter, tag, and manage all your alphas using custom workflow statuses (Draft, Promising, Simulated, etc.).
- **Research Documentation**: Auto-structured alpha explanations (Idea, Rationale for Data, Rationale for Operators) attached directly to expressions.
- **Local-First Architecture**: Powered by a robust SQLite operational database and DuckDB for fast catalog searches.

## 3. Architecture
- **Backend**: FastAPI (Python) via `uv`.
- **Frontend**: React SPA using Vite, TypeScript, TailwindCSS, and `zustand`.
- **Storage**: SQLite (`harness.db`) and DuckDB (`catalog.duckdb`), persisting locally at `~/.alpha-harness`.
- **Integration**: Secure, local-only authentication via AES-GCM vault. Credentials never leave your machine.

## 4. Requirements
- macOS (Apple Silicon optimized)
- Python >= 3.14
- `uv` (Astral package manager)
- Node.js & `pnpm`

## 5. MacBook Installation
```bash
git clone https://github.com/YOUR_GITHUB/alpha-forge.git
cd alpha-forge
```

## 6. Development Setup
To run the platform locally during development:
1. Start the backend:
```bash
cd backend
uv run uvicorn alpha_harness.main:app --reload --port 8000
```
2. Start the frontend:
```bash
cd frontend
pnpm run dev
```

## 7. Environment Variables
No `.env` file is required for core functionality. Credentials and API configurations are managed directly through the application's secure UI and stored in the encrypted local vault.

## 8. Attribution
AlphaForge is built upon the robust, open-source foundation of the **[Alpha Harness](https://github.com/residual-lab/alpha-harness)** project created by Residual Lab. Alpha Harness provides the essential local-first engine and WorldQuant BRAIN proxy integration, upon which AlphaForge adds extensive personal research workflow, experiment tracking, and workbench capabilities.

## 9. License
MIT License. See `LICENSE` for more details.
