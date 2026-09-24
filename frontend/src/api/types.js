/**
 * Types shared by more than one screen; screen-specific contracts live next to their endpoints
 * in `api/<domain>.ts`. Turnover, returns, drawdown, margin, coverage and truncation are
 * FRACTIONS (0.64 = 64%), Sharpe and Fitness are plain ratios, and a timestamp without an
 * offset is UTC.
 */
import { qs } from './http.js'
export const toScopeBody = (scope) => ({
  instrument_type: scope.instrumentType,
  region: scope.region,
  delay: scope.delay,
  universe: scope.universe,
})
/** A scope in the query string. Every route that reads one takes ``instrumentType``. */
export const scopeQs = (scope, extra = {}) =>
  qs({
    region: scope?.region,
    delay: scope?.delay,
    universe: scope?.universe,
    instrumentType: scope?.instrumentType,
    ...extra,
  })
export const scopeLabel = (scope) => `${scope.region} · D${scope.delay} · ${scope.universe}`
