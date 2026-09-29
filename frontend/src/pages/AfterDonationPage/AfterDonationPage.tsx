import { Button } from '@maxhub/max-ui'
import { CalendarX, Download, HeartHandshake } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '@/api/client'
import {
  type ApplicationFormat,
  useDonationAfter,
  useDownloadApplication,
  useSendApplication,
  useSetRestDayUsed,
} from '@/api/hooks/afterDonation'
import type { LeaveApplicationInput } from '@/api/types'
import { DocumentsList } from '@/components/features/after-donation/DocumentsList/DocumentsList'
import {
  LeaveApplicationForm,
  type LeaveApplicationValues,
} from '@/components/features/after-donation/LeaveApplicationForm/LeaveApplicationForm'
import { RestDayStatus } from '@/components/features/after-donation/RestDayStatus/RestDayStatus'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { SegmentedControl } from '@/components/shared/SegmentedControl/SegmentedControl'
import { SegmentedControlItem } from '@/components/shared/SegmentedControl/SegmentedControlItem'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { useToast } from '@/hooks/useToast'
import { saveFile } from '@/utils/download'
import { formatDayMonth, parseISODate } from '@/utils/format'

import styles from './AfterDonationPage.module.scss'

// Бэк реквизиты работодателя не хранит намеренно — помним их только на устройстве
const EMPLOYER_KEY = 'kaplya:leave-application'
const EMPLOYER_FIELDS = ['employer_name', 'head_position', 'head_name', 'employee_position'] as const

const loadEmployer = (): Pick<LeaveApplicationValues, (typeof EMPLOYER_FIELDS)[number]> => {
  const empty = { employer_name: '', head_position: '', head_name: '', employee_position: '' }
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(EMPLOYER_KEY) ?? '{}') as object) }
  } catch {
    return empty
  }
}

const saveEmployer = (values: LeaveApplicationValues) => {
  try {
    localStorage.setItem(EMPLOYER_KEY, JSON.stringify(Object.fromEntries(EMPLOYER_FIELDS.map((key) => [key, values[key]]))))
  } catch {
    // приватный режим или хранилище отключено — просто не запомним
  }
}

const toInput = (values: LeaveApplicationValues): LeaveApplicationInput => ({
  employer_name: values.employer_name.trim() || null,
  head_position: values.head_position.trim() || null,
  head_name: values.head_name.trim() || null,
  employee_position: values.employee_position.trim() || null,
  rest_date: values.attach_to_vacation ? null : values.rest_date || null,
  attach_to_vacation: values.attach_to_vacation,
})

/** «После донации»: справки, дополнительный день отдыха и заявление работодателю (ст. 186 ТК РФ). */
export const AfterDonationPage = () => {
  const { id } = useParams()
  const donationId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const after = useDonationAfter(donationId)
  const setUsed = useSetRestDayUsed(donationId)
  const send = useSendApplication(donationId)
  const download = useDownloadApplication(donationId)
  const [values, setValues] = useState<LeaveApplicationValues>(() => ({
    ...loadEmployer(),
    rest_date: '',
    attach_to_vacation: false,
  }))
  const [format, setFormat] = useState<ApplicationFormat>('pdf')
  const [restDateError, setRestDateError] = useState<string>()
  const goHome = () => navigate('/home', { replace: true })

  const screen = (content: ReactNode, footer: ReactNode) => (
    <Screen header={<PageHeader title="После донации" onBack={goHome} />} footer={<StickyFooter>{footer}</StickyFooter>}>
      {content}
      <Toast message={toast.message} />
    </Screen>
  )
  const homeButton = (
    <Button size="large" stretched onClick={goHome}>
      На главную
    </Button>
  )

  if (after.isPending) return screen([72, 180, 160, 320].map((height) => <Skeleton key={height} height={height} />), homeButton)

  if (after.isError) {
    const notFound = after.error instanceof ApiError && after.error.status === 404
    return screen(
      notFound ? (
        <InfoRow icon={CalendarX} tone="gray" title="Донация не найдена" description="Возможно, ссылка устарела" />
      ) : (
        <ErrorState text="Не удалось загрузить данные" retrying={after.isFetching} onRetry={() => after.refetch()} />
      ),
      homeButton,
    )
  }

  const { donated_on: donatedOn, center_name: centerName, documents, rest_day: restDay } = after.data
  const canApply = !restDay.used && restDay.days_left >= 0

  const onChange = <K extends keyof LeaveApplicationValues>(key: K, value: LeaveApplicationValues[K]) => {
    setValues((previous) => {
      const next = { ...previous, [key]: value }
      saveEmployer(next)
      return next
    })
    if (key === 'rest_date' || key === 'attach_to_vacation') setRestDateError(undefined)
  }

  const onApplicationError = (error: Error) => {
    if (error instanceof ApiError && error.fields?.rest_date) {
      setRestDateError(error.fields.rest_date)
      return
    }
    if (error instanceof ApiError && error.code === 'bot_send_failed') {
      toast.show('Не удалось отправить в чат. Скачайте файл')
      return
    }
    toast.show('Не получилось подготовить заявление. Попробуйте ещё раз')
  }

  const sendToChat = () =>
    send.mutate(
      { format, input: toInput(values) },
      { onSuccess: () => toast.show('Заявление отправлено в чат с ботом'), onError: onApplicationError },
    )

  const downloadFile = () =>
    download.mutate(
      { format, input: toInput(values) },
      { onSuccess: ({ blob, fileName }) => saveFile(blob, fileName), onError: onApplicationError },
    )

  const markUsed = (used: boolean) =>
    setUsed.mutate(used, {
      onSuccess: () => toast.show(used ? 'Отметили: день отдыха использован' : 'Отметку сняли'),
      onError: () => toast.show('Не удалось сохранить. Попробуйте ещё раз'),
    })

  return screen(
    <>
      <InfoRow
        icon={HeartHandshake}
        tone="red"
        title="Спасибо, что сдали кровь!"
        description={[formatDayMonth(parseISODate(donatedOn)), centerName].filter(Boolean).join(' · ')}
      />
      <DocumentsList documents={documents} />
      <RestDayStatus restDay={restDay} />
      {canApply && (
        <>
          <LeaveApplicationForm
            values={values}
            donatedOn={donatedOn}
            deadline={restDay.deadline}
            restDateError={restDateError}
            onChange={onChange}
          />
          <SegmentedControl label="Формат заявления">
            <SegmentedControlItem selected={format === 'pdf'} onSelect={() => setFormat('pdf')}>
              PDF
            </SegmentedControlItem>
            <SegmentedControlItem selected={format === 'docx'} onSelect={() => setFormat('docx')}>
              DOCX
            </SegmentedControlItem>
          </SegmentedControl>
          <OutlineButton
            size="medium"
            stretched
            loading={download.isPending}
            iconBefore={<Download size={20} />}
            onClick={downloadFile}
          >
            Скачать {format.toUpperCase()}
          </OutlineButton>
        </>
      )}
      {!restDay.used && (
        <div className={styles['after-donation__used']}>
          <OutlineButton size="medium" stretched loading={setUsed.isPending} onClick={() => markUsed(true)}>
            Я уже использовал(а) день отдыха
          </OutlineButton>
        </div>
      )}
      {restDay.used && (
        <OutlineButton size="medium" stretched loading={setUsed.isPending} onClick={() => markUsed(false)}>
          Ещё не использовал(а)
        </OutlineButton>
      )}
    </>,
    canApply ? (
      <Button size="large" stretched loading={send.isPending} onClick={sendToChat}>
        Прислать заявление в чат
      </Button>
    ) : (
      homeButton
    ),
  )
}
