'use client';

import { useEffect, useMemo, useState } from 'react';

import styles from './SettingsSheet.module.css';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    phone_number?: string;
    email?: string;
  } | null;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const REMINDER_TIMES = ['08:00', '12:00', '18:30'];

export function SettingsSheet({ open, onClose, user }: SettingsSheetProps) {
  const [remindersOn, setRemindersOn] = useState(false);
  const [reminderIndex, setReminderIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [birthdate, setBirthdate] = useState<{ day: number; month: number; year: number }>(
    () => ({ day: 1, month: 1, year: 2000 }),
  );

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const reminderTime = REMINDER_TIMES[reminderIndex];
  const displayBirthdate = birthdate
    ? `${MONTHS[birthdate.month - 1]} ${birthdate.day}, ${birthdate.year}`
    : 'Not set';
  const username = user?.username ? `@${user.username}` : user?.phone_number ?? 'Not shared';

  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, index) => index + 1), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, index) => currentYear - index);
  }, []);

  if (!open) {
    return null;
  }

  const handleCycleReminder = () => {
    if (!remindersOn) {
      return;
    }

    setReminderIndex((prev) => (prev + 1) % REMINDER_TIMES.length);
  };

  const handleBirthdateChange = (partial: Partial<{ day: number; month: number; year: number }>) => {
    setBirthdate((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <p className={styles.titleEyebrow}>Profile</p>
            <h2 className={styles.title}>Settings</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </header>

        <div className={styles.sheetBody}>
          <section className={styles.section}>
            <p className={styles.sectionTitle}>My subscription</p>
            <button type="button" className={styles.rowButton}>
              <div>
                <span className={styles.rowLabel}>Member</span>
                <span className={styles.rowDescription}>Limited access</span>
              </div>
              <span aria-hidden className={styles.chevron}>
                ›
              </span>
            </button>
          </section>

          <section className={styles.section}>
            <p className={styles.sectionTitle}>Security</p>
            <div className={styles.row}>
              <div>
                <span className={styles.rowLabel}>Password</span>
                <span className={styles.rowDescription}>Keep your account protected</span>
              </div>
              <button type="button" className={styles.updateButton}>
                UPDATE
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <p className={styles.sectionTitle}>Training reminders</p>
            <div className={styles.row}>
              <div>
                <span className={styles.rowLabel}>Turn on reminders</span>
                <span className={styles.rowDescription}>Get a nudge to train</span>
              </div>
              <Switch checked={remindersOn} onChange={setRemindersOn} />
            </div>
            <button
              type="button"
              className={`${styles.rowButton} ${!remindersOn ? styles.rowDisabled : ''}`}
              onClick={handleCycleReminder}
              aria-disabled={!remindersOn}
            >
              <div>
                <span className={styles.rowLabel}>When?</span>
                <span className={styles.rowDescription}>
                  {remindersOn ? 'Every day' : 'No days selected'}
                </span>
              </div>
              <div className={styles.timeValue}>
                <span>{reminderTime}</span>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </div>
            </button>
          </section>

          <section className={styles.section}>
            <p className={styles.sectionTitle}>My information</p>
            <div className={styles.fieldGroup}>
              <Field label="First name" value={user?.first_name ?? 'Not provided'} />
              <Field label="Last name" value={user?.last_name ?? 'Not provided'} />
              <Field label="Username / contact" value={username} />
              <Field label="Email" value={user?.email ?? 'Add email'} />
              <button type="button" className={`${styles.rowButton} ${styles.fieldRow}`} onClick={() => setPickerOpen((prev) => !prev)}>
                <div>
                  <span className={styles.rowLabel}>Birthdate</span>
                  <span className={styles.rowDescription}>Tap to adjust</span>
                </div>
                <span>{displayBirthdate}</span>
              </button>
            </div>
            {pickerOpen ? (
              <div className={styles.wheelPicker}>
                <p className={styles.wheelLabel}>Set your birthdate</p>
                <div className={styles.wheelColumns}>
                  <WheelColumn
                    label="Month"
                    options={MONTHS.map((month, index) => ({ label: month.slice(0, 3), value: index + 1 }))}
                    value={birthdate.month}
                    onChange={(value) => handleBirthdateChange({ month: value })}
                  />
                  <WheelColumn
                    label="Day"
                    options={dayOptions.map((day) => ({ label: day.toString(), value: day }))}
                    value={birthdate.day}
                    onChange={(value) => handleBirthdateChange({ day: value })}
                  />
                  <WheelColumn
                    label="Year"
                    options={yearOptions.map((year) => ({ label: year.toString(), value: year }))}
                    value={birthdate.year}
                    onChange={(value) => handleBirthdateChange({ year: value })}
                  />
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${styles.row} ${styles.fieldRow}`}>
      <div>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowValue}>{value}</span>
      </div>
    </div>
  );
}

interface WheelColumnProps {
  label: string;
  options: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
}

function WheelColumn({ label, options, value, onChange }: WheelColumnProps) {
  return (
    <div className={styles.wheelColumn}>
      <p className={styles.wheelColumnLabel}>{label}</p>
      <div className={styles.wheelScroller}>
        {options.map((option) => (
          <button
            key={`${label}-${option.value}`}
            type="button"
            className={`${styles.wheelOption} ${option.value === value ? styles.wheelOptionActive : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
