export const PATIENTS_PER_WHOLE_BLOOD = 3
export const PATIENTS_PER_PLASMA = 1

export const getHelpedPatients = (whole: number, plasma: number): number =>
  whole * PATIENTS_PER_WHOLE_BLOOD + plasma * PATIENTS_PER_PLASMA

export const IMPACT_EXPLANATION =
  'Из одной донации крови получают эритроциты, плазму и тромбоциты. Таким образом, каждая донация может помочь до трёх пациентам.'
