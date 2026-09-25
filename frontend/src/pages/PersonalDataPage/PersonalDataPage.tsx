import { Button, Typography } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { usePersonalData, useSavePersonalData } from '@/api/hooks/me'
import type { PersonalDataFields } from '@/api/types'
import { FIELD_ORDER, FIELDS, isComplete, validateAll, type FieldErrors, type FieldKey } from '@/components/features/personal-data/fields'
import { PersonalDataForm } from '@/components/features/personal-data/PersonalDataForm/PersonalDataForm'
import { PersonalDataView } from '@/components/features/personal-data/PersonalDataView/PersonalDataView'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog'
import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { useToast } from '@/hooks/useToast'

import styles from './PersonalDataPage.module.scss'

const pickFields = (data: PersonalDataFields): PersonalDataFields =>
  Object.fromEntries(FIELD_ORDER.map((key) => [key, data[key] ?? ''])) as unknown as PersonalDataFields

const scrollToFirstError = () =>
  window.requestAnimationFrame(() =>
    document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
  )

/** Экран «Проверьте данные» с режимом редактирования. */
export const PersonalDataPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const query = usePersonalData()
  const save = useSavePersonalData()
  const [draft, setDraft] = useState<PersonalDataFields | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [leaveOpen, setLeaveOpen] = useState(false)

  const data = query.data ? pickFields(query.data) : null
  const editing = draft !== null
  const hasChanges = Boolean(draft && data && FIELD_ORDER.some((key) => draft[key] !== data[key]))

  const startEditing = () => {
    if (!data) return
    setDraft(data)
    setErrors({})
  }

  const cancelEditing = () => {
    setDraft(null)
    setLeaveOpen(false)
    setErrors({})
  }

  const onChange = (key: FieldKey, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const onBlur = (key: FieldKey) => {
    if (!draft) return
    const error = FIELDS[key].validate?.(draft[key]) ?? undefined
    setErrors((current) => ({ ...current, [key]: error }))
  }

  const submit = () => {
    if (!draft) return
    const nextErrors = validateAll(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return scrollToFirstError()

    save.mutate(draft, {
      onSuccess: () => {
        setDraft(null)
        toast.show('Данные сохранены')
      },
      onError: (error) => {
        // 422 — бэк вернул ошибки по полям, показываем их у полей
        if (error instanceof ApiError && error.fields) {
          setErrors(error.fields as FieldErrors)
          scrollToFirstError()
        } else {
          toast.show('Не удалось сохранить. Попробуйте ещё раз')
        }
      },
    })
  }

  const onBack = () => {
    if (!editing) return navigate('/donation-info')
    if (hasChanges) return setLeaveOpen(true)
    cancelEditing()
  }

  const renderContent = () => {
    if (query.isPending) {
      return [220, 110, 150].map((height) => <Skeleton key={height} height={height} />)
    }
    if (query.isError || !data) {
      return <ErrorState text="Не удалось загрузить данные" retrying={query.isFetching} onRetry={() => query.refetch()} />
    }
    if (draft) return <PersonalDataForm data={draft} errors={errors} onChange={onChange} onBlur={onBlur} />
    return (
      <>
        <div className={styles['personal-data-page__intro']}>
          <Typography.Text variant="detail" color="secondary">
            Эти данные нужны центру крови для записи
          </Typography.Text>
          {query.data?.is_demo && <DemoBadge />}
        </div>
        <PersonalDataView data={data} />
      </>
    )
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
              <Button size="large" stretched loading={save.isPending} disabled={save.isPending} onClick={submit}>
                Сохранить
              </Button>
            </>
          ) : (
            <>
              <OutlineButton stretched disabled={!data} onClick={startEditing}>
                Данные неверны
              </OutlineButton>
              <Button size="large" stretched disabled={!data || !isComplete(data)} onClick={() => navigate('/booking/type')}>
                Далее
              </Button>
            </>
          )}
        </StickyFooter>
      }
    >
      {renderContent()}
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
