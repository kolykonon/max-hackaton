import { Button, Typography } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FIELD_ORDER, validateAll, isComplete, FIELDS, type FieldErrors, type FieldKey } from '@/components/features/personal-data/fields'
import { PersonalDataForm } from '@/components/features/personal-data/PersonalDataForm/PersonalDataForm'
import { PersonalDataView } from '@/components/features/personal-data/PersonalDataView/PersonalDataView'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog'
import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { Toast } from '@/components/shared/Toast/Toast'
import { DEMO_PERSONAL_DATA, type PersonalData } from '@/content/demo'
import { useToast } from '@/hooks/useToast'

import styles from './PersonalDataPage.module.scss'

/** Экран «Проверьте данные» с режимом редактирования. */
export const PersonalDataPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState<PersonalData>(DEMO_PERSONAL_DATA)
  const [draft, setDraft] = useState<PersonalData>(DEMO_PERSONAL_DATA)
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const hasChanges = FIELD_ORDER.some((key) => draft[key] !== data[key])

  const startEditing = () => {
    setDraft(data)
    setErrors({})
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setLeaveOpen(false)
    setErrors({})
  }

  const onChange = (key: FieldKey, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const onBlur = (key: FieldKey) => {
    const error = FIELDS[key].validate?.(draft[key]) ?? undefined
    setErrors((current) => ({ ...current, [key]: error }))
  }

  // TODO: PUT /me/personal-data; 422 — ошибки из fields, сеть — тост «Не удалось сохранить…»
  const save = () => {
    const nextErrors = validateAll(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() =>
        document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      )
      return
    }
    setSaving(true)
    window.setTimeout(() => {
      setData(draft)
      setSaving(false)
      setEditing(false)
      toast.show('Данные сохранены')
    }, 600)
  }

  const onBack = () => {
    if (!editing) return navigate('/donation-info')
    if (hasChanges) return setLeaveOpen(true)
    cancelEditing()
  }

  return (
    <Screen
      header={<PageHeader title={editing ? 'Изменение данных' : 'Проверьте данные'} align="center" onBack={onBack} />}
      footer={
        <StickyFooter>
          {editing ? (
            <>
              <OutlineButton stretched onClick={cancelEditing}>
                Отмена
              </OutlineButton>
              <Button size="large" stretched loading={saving} disabled={saving} onClick={save}>
                Сохранить
              </Button>
            </>
          ) : (
            <>
              <OutlineButton stretched onClick={startEditing}>
                Данные неверны
              </OutlineButton>
              <Button size="large" stretched disabled={!isComplete(data)} onClick={() => navigate('/booking/type')}>
                Далее
              </Button>
            </>
          )}
        </StickyFooter>
      }
    >
      {!editing && (
        <div className={styles['personal-data-page__intro']}>
          <Typography.Text variant="detail" color="secondary">
            Эти данные нужны центру крови для записи
          </Typography.Text>
          <DemoBadge />
        </div>
      )}
      {editing ? (
        <PersonalDataForm data={draft} errors={errors} onChange={onChange} onBlur={onBlur} />
      ) : (
        <PersonalDataView data={data} />
      )}
      <ConfirmDialog
        open={leaveOpen}
        title="Выйти без сохранения?"
        confirmText="Выйти"
        cancelText="Остаться"
        destructive
        onConfirm={cancelEditing}
        onCancel={() => setLeaveOpen(false)}
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
