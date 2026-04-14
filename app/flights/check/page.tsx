/**
 * /flights/check — public page (no auth required to check)
 *
 * Checking compensation is free and requires no account.
 * Saving the result to the dashboard requires auth — that gate
 * is enforced inside FlightCheckClient when the save button is clicked.
 */

import FlightCheckClient from './components/FlightCheckClient'

export default function FlightCheckPage() {
  return <FlightCheckClient />
}
