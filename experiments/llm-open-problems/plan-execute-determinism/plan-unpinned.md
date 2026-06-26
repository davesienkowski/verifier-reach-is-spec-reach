# PLAN — CSV export for the Reports page (as a typical planner emits it)

Stack: TypeScript, React + Vite web app in `apps/web`. Rows are already in memory as `ReportRow[]`.

1. Create a CSV serialization helper that turns the report rows into a CSV string with a header row
   and correct escaping (commas, quotes, newlines), handling the empty-rows case.
2. Add unit tests for the helper covering the escaping edge cases.
3. Add an "Export CSV" button to the Reports page (`apps/web/src/pages/Reports.tsx`) that calls the
   helper on the current rows and downloads `reports.csv`.

<!-- This plan names "a CSV helper" but does NOT pin its file path or exported signature. Tasks 1 and 3
     are executed independently (different waves / executor contexts). The experiment measures whether
     the button-author (task 3) and the helper-author (task 1) independently converge on the same
     import path + function name + arity — or diverge into a broken seam. -->
