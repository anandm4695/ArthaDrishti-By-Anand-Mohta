export interface FetchAllRowsOptions {
  select?: string;
  orderColumn?: string;
  ascending?: boolean;
  secondaryOrderColumn?: string;
  secondaryAscending?: boolean;
  pageSize?: number;
}

/**
 * Fetches all rows from a Supabase table using range pagination.
 *
 * PostgREST enforces a server-side max-rows limit (1000 by default in Supabase).
 * A query with `.limit(50000)` will be silently capped by PostgREST to 1000 rows.
 * By querying with `.range(from, from + pageSize - 1)` in a loop, this helper
 * fetches all records without truncation.
 */
export async function fetchAllRowsFromTable(
  client: any,
  tableName: string,
  userId: string,
  options?: FetchAllRowsOptions
): Promise<{ data: any[] | null; error: any }> {
  const pageSize = options?.pageSize || 1000;
  const selectCols = options?.select || "*";
  const allRows: any[] = [];
  let from = 0;

  while (true) {
    let query = client
      .from(tableName)
      .select(selectCols)
      .eq("user_id", userId);

    if (options?.orderColumn) {
      query = query.order(options.orderColumn, { ascending: options.ascending ?? false });
      if (options?.secondaryOrderColumn) {
        query = query.order(options.secondaryOrderColumn, {
          ascending: options.secondaryAscending ?? true,
        });
      }
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error) {
      if (from === 0) return { data: null, error };
      console.error(`[fetchAllRowsFromTable:${tableName}] Offset ${from} fetch error:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { data: allRows, error: null };
}
