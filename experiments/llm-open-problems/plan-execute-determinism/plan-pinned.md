# PLAN — CSV export for the Reports page (WITH an interface contract)

Stack: TypeScript, React + Vite web app in `apps/web`. Rows are `ReportRow[]`.

## Interface contract (shared seam — pinned so independent waves integrate)
> Task 1 MUST export exactly: `export function toCsv(rows: ReportRow[]): string`
> from the file `apps/web/src/lib/csv.ts`. Task 3 MUST import `toCsv` from `@/lib/csv`.

1. Create the CSV serialization helper at the pinned path/signature above (header row + escaping of
   commas/quotes/newlines + empty-rows case).
2. Add unit tests for the helper.
3. Add an "Export CSV" button to `apps/web/src/pages/Reports.tsx` that calls `toCsv` on the current
   rows and downloads `reports.csv`.
