"""Ad-level descriptive 2x2 estimates; no automatic continuity correction."""
import math


def contingency(cells):
    (a, b), (c, d) = cells
    if any(x < 0 for row in cells for x in row):
        raise ValueError("Negative cells")
    ratio = a * d / (b * c) if b * c else None
    ci = None
    if min(a, b, c, d) > 0:
        se = math.sqrt(sum(1 / x for x in (a, b, c, d)))
        ci = [math.exp(math.log(ratio) + z * 1.96 * se) for z in (-1, 1)]
    return {"cells": cells, "n": a+b+c+d, "first_n": a+b, "other_n": c+d,
            "first_rate": a/(a+b) if a+b else None, "other_rate": c/(c+d) if c+d else None,
            "or": ratio, "or_ci95": ci, "ci_method": "Woolf log OR +/- 1.96 sqrt(1/a+1/b+1/c+1/d); undefined with zero cell; no correction"}


def mh(tables):
    import numpy as np
    import statsmodels
    from statsmodels.stats.contingency_tables import StratifiedTable
    nonempty = [t["cells"] for t in tables if t["n"]]
    if not nonempty:
        return {"or": None, "or_ci95": None, "n": 0, "strata": 0}
    model = StratifiedTable(np.asarray(nonempty, dtype=float).transpose(1, 2, 0), shift_zeros=False)
    ratio = float(model.oddsratio_pooled)
    lo, hi = map(float, model.oddsratio_pooled_confint(alpha=0.05))
    return {"or": ratio if math.isfinite(ratio) else None,
            "or_ci95": [lo, hi] if all(math.isfinite(v) for v in (lo, hi)) else None,
            "n": sum(t["n"] for t in tables), "strata": len(nonempty),
            "method": "Mantel–Haenszel pooled OR, stratified by source; no zero-cell correction",
            "ci_method": "Robins–Breslow–Greenland (1986) pooled log-OR variance; normal 95% interval",
            "implementation": "statsmodels.stats.contingency_tables.StratifiedTable", "version": statsmodels.__version__}
