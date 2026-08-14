export function emptyManual() {
  return {
    pnr: '',
    ref: '',
    trn: '',
    dt: '',
    cls: '',
    st: 'CNF',
    sig: '',
  }
}

export function manualFromPayload(seedPayload) {
  if (!seedPayload) return emptyManual()
  return {
    pnr: seedPayload.pnr || '',
    ref: seedPayload.ref || seedPayload.ticketRef || '',
    trn: seedPayload.trn || seedPayload.trainNo || '',
    dt: seedPayload.dt || seedPayload.journeyDate || '',
    cls: seedPayload.cls || seedPayload.classCode || '',
    st: seedPayload.st || seedPayload.status || 'CNF',
    sig: seedPayload.sig || seedPayload.signature || '',
  }
}
