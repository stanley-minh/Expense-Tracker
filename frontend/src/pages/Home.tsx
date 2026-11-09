/**
 * Home page.
 *
 * Temporary static screen used to check the styling setup:
 * Tailwind handles the layout (padding, width, centering) and
 * daisyUI provides the components (card, stat, btn) that follow the theme.
 *
 * @remarks
 * Values are hard-coded for now. The next step fetches the real
 * expenses from the PHP API (GET /api/expenses).
 */
function Home() {
  return (
    <main className="min-h-screen bg-base-200 p-8">
      <div className="card mx-auto max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Expense Tracker</h1>

          <div className="stat px-0">
            <div className="stat-title">Total this month</div>
            <div className="stat-value text-primary">€61.40</div>
          </div>

          <div className="card-actions justify-end">
            <button type="button" className="btn btn-primary">
              Add expense
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;
