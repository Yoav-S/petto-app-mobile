export type RemindersTabName = 'Today' | 'Upcoming' | 'Recent';

/** Survives leaving the reminders list so back lands on the same tab. */
let lastRemindersTab: RemindersTabName = 'Today';

export function getRemindersTab(): RemindersTabName {
  return lastRemindersTab;
}

export function setRemindersTab(tab: RemindersTabName) {
  lastRemindersTab = tab;
}
