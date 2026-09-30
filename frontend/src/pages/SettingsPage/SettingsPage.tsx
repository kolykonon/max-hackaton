import { Button, Typography } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { useMe, usePersonalData, useSavePersonalData, useUpdateRegion } from '@/api/hooks/me'
import { RegionRow } from '@/components/features/account/RegionRow/RegionRow'
import { RegionSheet } from '@/components/features/account/RegionSheet/RegionSheet'
import {
  FIELDS,
  fromApi,
  SECTIONS,
  toApi,
  validateAll,
  type FieldErrors,
  type FieldKey,
  type PersonalDataValues,
  type SectionKey,
} from '@/components/features/personal-data/fields'
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

import styles from './SettingsPage.module.scss'

const scrollToFirstError = () =>
  window.requestAnimationFrame(() =>
    document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
  )

const isSection = (value: string | null): value is SectionKey => value !== null && value in SECTIONS

/**
 * «Настройки»: паспорт, полис ОМС, контакты и регион. Заполняются один раз и подставляются в каждую запись.
 * ?section=oms — редактирование раздела; ?return=/booking/check — после сохранения вернуться в запись.
 */
export const SettingsPage = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const section = isSection(params.get('section')) ? (params.get('section') as SectionKey) : null
  // Только внутренние пути — чтобы параметр не увёл на чужой адрес
  const returnTo = params.get('return')?.startsWith('/') ? params.get('return') : null
  const toast = useToast()
  const me = useMe()
  const query = usePersonalData()
  const save = useSavePersonalData()
  const updateRegion = useUpdateRegion()
  const [draft, setDraft] = useState<PersonalDataValues | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)

  const data = query.data ? fromApi(query.data) : null
  const values = draft ?? data
  const fields = section ? SECTIONS[section].fields : []
  const hasChanges = Boolean(draft && data && fields.some((key) => draft[key] !== data[key]))

  const openSection = (key: SectionKey) => setParams({ section: key })

  const leaveSection = () => {
    setDraft(null)
    setErrors({})
    setLeaveOpen(false)
    if (returnTo) navigate(returnTo, { replace: true })
    else setParams({}, { replace: true })
  }

  const onChange = (key: FieldKey, value: string) => {
    if (values) setDraft({ ...values, [key]: value })
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const onBlur = (key: FieldKey) => {
    if (!values) return
    setErrors((current) => ({ ...current, [key]: FIELDS[key].validate?.(values[key]) ?? undefined }))
  }

  const submit = () => {
    if (!values) return
    const nextErrors = validateAll(values, fields)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return scrollToFirstError()

    save.mutate(toApi(values, fields), {
      onSuccess: () => {
        toast.show('Данные сохранены')
        leaveSection()
      },
      onError: (error) => {
        if (error instanceof ApiError && error.fields) {
          setErrors(error.fields as FieldErrors)
          scrollToFirstError()
        } else {
          toast.show('Не удалось сохранить. Попробуйте ещё раз')
        }
      },
    })
  }

  const selectRegion = (regionId: number) =>
    updateRegion.mutate(regionId, {
      onSuccess: () => {
        setRegionOpen(false)
        toast.show('Регион сохранён')
      },
      onError: () => toast.show('Не удалось сохранить регион. Попробуйте ещё раз'),
    })

  const onBack = () => {
    if (!section) return navigate('/account')
    if (hasChanges) return setLeaveOpen(true)
    leaveSection()
  }

  const renderContent = () => {
    if (query.isPending) return [220, 110, 150].map((height) => <Skeleton key={height} height={height} />)
    if (query.isError || !values) {
      return <ErrorState text="Не удалось загрузить данные" retrying={query.isFetching} onRetry={() => query.refetch()} />
    }
    if (section) return <PersonalDataForm section={section} data={values} errors={errors} onChange={onChange} onBlur={onBlur} />
    return (
      <>
        <div className={styles['settings-page__intro']}>
          <Typography.Text variant="detail" color="secondary">
            Заполните один раз — подставим в каждую запись на донацию
          </Typography.Text>
          {query.data?.is_demo && <DemoBadge />}
        </div>
        <PersonalDataView data={values} onEdit={openSection} />
        <RegionRow regionName={me.data?.region?.name} onOpen={() => setRegionOpen(true)} />
      </>
    )
  }

  return (
    <Screen
      header={<PageHeader title={section ? 'Изменение данных' : 'Настройки'} align="center" onBack={onBack} />}
      footer={
        section && (
          <StickyFooter>
            <OutlineButton stretched onClick={onBack}>
              Отмена
            </OutlineButton>
            <Button size="large" stretched loading={save.isPending} disabled={save.isPending || !values} onClick={submit}>
              Сохранить
            </Button>
          </StickyFooter>
        )
      }
    >
      {renderContent()}
      <RegionSheet
        open={regionOpen}
        selectedId={me.data?.region?.id ?? null}
        onSelect={selectRegion}
        onClose={() => setRegionOpen(false)}
      />
      <ConfirmDialog
        open={leaveOpen}
        title="Выйти без сохранения?"
        confirmText="Выйти"
        cancelText="Остаться"
        destructive
        onConfirm={leaveSection}
        onCancel={() => setLeaveOpen(false)}
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
