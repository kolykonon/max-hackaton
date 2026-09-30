import { Typography } from "@maxhub/max-ui";
import { useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";

import { useCurrentAppointment } from "@/api/hooks/appointments";
import { ApiError } from "@/api/client";
import { type DemoPath, useDemoAction } from "@/api/hooks/demo";
import { useMe, useProgress, useUpdateRegion } from "@/api/hooks/me";
import { BloodCard } from "@/components/features/account/BloodCard/BloodCard";
import { BloodStat } from "@/components/features/account/BloodCard/BloodStat";
import {
  DonorCode,
  DonorCodeSheet,
} from "@/components/features/account/BloodCard/DonorCode";
import {
  DemoMenuSheet,
  type DemoAction,
  type DemoAppointmentAction,
} from "@/components/features/account/DemoMenuSheet/DemoMenuSheet";
import { DonationHistorySheet } from "@/components/features/account/DonationHistorySheet/DonationHistorySheet";
import { DonationTypeSheet } from "@/components/features/account/DonationTypeSheet/DonationTypeSheet";
import { DonorLevelsSheet } from "@/components/features/account/DonorLevelsSheet/DonorLevelsSheet";
import { GuideButton } from "@/components/features/account/GuideButton/GuideButton";
import { GoalCard } from "@/components/features/account/GoalCard/GoalCard";
import { HistoryButton } from "@/components/features/account/HistoryButton/HistoryButton";
import { HonoraryAchievedCard } from "@/components/features/account/HonoraryAchievedCard/HonoraryAchievedCard";
import { HonoraryEta } from "@/components/features/account/HonoraryEta/HonoraryEta";
import { LevelCard } from "@/components/features/account/LevelCard/LevelCard";
import { getHelpedPatients } from "@/content/impact";
import { ProfileHeader } from "@/components/features/account/ProfileHeader/ProfileHeader";
import { ReferralBanner } from "@/components/features/account/ReferralBanner/ReferralBanner";
import { RegionSheet } from "@/components/features/account/RegionSheet/RegionSheet";
import { Screen } from "@/components/layout/Screen/Screen";
import { ErrorState } from "@/components/shared/ErrorState/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton/Skeleton";
import { Toast } from "@/components/shared/Toast/Toast";
import { getAbo, getRhesus } from "@/content/bloodGroups";
import type { DonationKind } from "@/content/types";
import { useToast } from "@/hooks/useToast";
import { formatYearsMonths } from "@/utils/format";

import { AccountDesktop } from "./AccountDesktop";
import styles from "./AccountPage.module.scss";

type Sheet = "levels" | "history" | "demo" | "region" | "code" | null;

const DEMO_MENU_TAPS = 5;

// На ПК (MAX на весь экран) — отдельный дашборд, на телефоне — привычная лента
const DESKTOP_QUERY = "(min-width: 960px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getIsDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

const DEMO_MESSAGES: Record<DemoAction, string> = {
  reset: "Профиль сброшен к демо-состоянию",
  remind: "Напоминание отправлено в чат",
  "ask-donated": "Вопрос «Сдали кровь?» отправлен в чат",
  complete: "Донация засчитана",
  interval_open: "Пуш «Интервал прошёл» отправлен в чат",
  deficit: "Пуш «Не хватает группы» отправлен в чат",
  rest_day: "Напоминание про день отдыха отправлено в чат",
};

const isAppointmentAction = (
  action: DemoAction,
): action is DemoAppointmentAction =>
  action === "remind" || action === "ask-donated" || action === "complete";

// Действиям с записью нужен её id; без записи кнопки в меню неактивны
const demoPath = (
  action: DemoAction,
  appointmentId?: number,
): DemoPath | null => {
  if (action === "reset") return "/demo/reset";
  if (isAppointmentAction(action)) {
    return appointmentId
      ? `/demo/appointments/${appointmentId}/${action}`
      : null;
  }
  return `/demo/pushes/${action}`;
};

/** Экран «Личный кабинет». */
export const AccountPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const progress = useProgress();
  const current = useCurrentAppointment();
  const demo = useDemoAction();
  const updateRegion = useUpdateRegion();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [typeSheet, setTypeSheet] = useState<DonationKind | null>(null);
  const [demoPending, setDemoPending] = useState<DemoAction | null>(null);
  const avatarTaps = useRef(0);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getIsDesktop);

  if (me.isPending || progress.isPending) {
    return (
      <Screen withTabBar>
        {[64, 120, 56, 150, 200].map((height, i) => (
          <Skeleton key={i} height={height} />
        ))}
      </Screen>
    );
  }

  if (me.isError || progress.isError) {
    const retry = () => Promise.all([me.refetch(), progress.refetch()]);
    return (
      <Screen withTabBar>
        <ErrorState
          text="Не удалось загрузить данные"
          retrying={me.isFetching || progress.isFetching}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const { total, honorary } = progress.data;
  const blood = me.data.blood;
  const goals: Record<DonationKind, { count: number; goal: number }> = {
    whole_blood: honorary.whole,
    plasma: honorary.plasma,
    mixed: honorary.mixed,
  };

  const onAvatarClick = () => {
    avatarTaps.current += 1;
    if (avatarTaps.current >= DEMO_MENU_TAPS) {
      avatarTaps.current = 0;
      setSheet("demo");
    }
  };

  const selectRegion = (regionId: number) => {
    updateRegion.mutate(regionId, {
      onSuccess: () => {
        setSheet(null);
        toast.show("Регион сохранён");
      },
      onError: () =>
        toast.show("Не удалось сохранить регион. Попробуйте ещё раз"),
    });
  };

  const copyCode = async () => {
    if (!blood.donor_code) return;
    try {
      await navigator.clipboard.writeText(blood.donor_code);
    } finally {
      toast.show("Код донора скопирован");
    }
  };

  const runDemo = (action: DemoAction) => {
    const path = demoPath(action, current.data?.appointment?.id);
    if (!path) return;
    setDemoPending(action);
    demo.mutate(path, {
      onSuccess: () => {
        setSheet(null);
        toast.show(DEMO_MESSAGES[action]);
      },
      onError: (error) =>
        toast.show(
          error instanceof ApiError && error.code === "donation_not_found"
            ? "Сначала засчитайте донацию — напоминать пока не о чем"
            : "Не получилось. Демо-режим включён на бэке?",
        ),
      onSettled: () => setDemoPending(null),
    });
  };

  const closeSheet = () => setSheet(null);

  return (
    <Screen
      withTabBar
      contentClassName={isDesktop ? styles["account-page--desktop"] : undefined}
    >
      {isDesktop ? (
        <AccountDesktop
          me={me.data}
          progress={progress.data}
          onAvatarClick={onAvatarClick}
          onCopyCode={copyCode}
          onOpenLevels={() => setSheet("levels")}
          onOpenHistory={() => setSheet("history")}
          onOpenType={setTypeSheet}
          onOpenHonorary={() => navigate("/honorary")}
          onOpenReferrals={() => navigate("/referrals")}
          onOpenRegion={() => setSheet("region")}
          onOpenSettings={() => navigate("/settings")}
          onOpenGuide={() => navigate("/guide")}
        />
      ) : (
        <>
          <ProfileHeader
            firstName={me.data.first_name}
            lastName={me.data.last_name ?? ""}
            photoUrl={me.data.photo_url ?? undefined}
            onAvatarClick={onAvatarClick}
            onOpenSettings={() => navigate("/settings")}
          />
          <LevelCard
            total={total}
            helped={getHelpedPatients(honorary.whole.count, honorary.plasma.count)}
            onOpen={() => setSheet("levels")}
          />
          <BloodCard
            footer={
              blood.donor_code && (
                <DonorCode
                  code={blood.donor_code}
                  onOpen={() => setSheet("code")}
                  onCopy={copyCode}
                />
              )
            }
          >
            <BloodStat
              label="Группа крови"
              value={blood.group ? getAbo(blood.group) : undefined}
            />
            <BloodStat
              label="Резус-фактор"
              value={blood.group ? getRhesus(blood.group) : undefined}
            />
            <BloodStat
              label="Kell"
              value={blood.kell?.replace("-", "−") ?? undefined}
            />
            <BloodStat label="Фенотип" value={blood.phenotype ?? undefined} />
          </BloodCard>
          <section className={styles["account-page__honorary"]}>
            <Typography.Text variant="subheader">
              Путь к званию «Почётный донор России»
            </Typography.Text>
            {honorary.achieved ? (
              <HonoraryAchievedCard onMore={() => navigate("/honorary")} />
            ) : (
              <>
                <div className={styles["account-page__goals"]}>
                  <GoalCard
                    kind="whole_blood"
                    {...goals.whole_blood}
                    onOpen={() => setTypeSheet("whole_blood")}
                  />
                  <GoalCard
                    kind="plasma"
                    {...goals.plasma}
                    onOpen={() => setTypeSheet("plasma")}
                  />
                </div>
                <GoalCard
                  kind="mixed"
                  {...goals.mixed}
                  hint={
                    honorary.mixed.goal === 60
                      ? `Ещё ${honorary.mixed.whole_needed_for_40} сдач цельной крови — и цель сократится до 40`
                      : undefined
                  }
                  onOpen={() => setTypeSheet("mixed")}
                />
                {honorary.eta && (
                  <HonoraryEta
                    eta={formatYearsMonths(
                      honorary.eta.years,
                      honorary.eta.months,
                    )}
                    onMore={() => navigate("/honorary")}
                  />
                )}
              </>
            )}
          </section>

          <ReferralBanner
            count={me.data.referrals_count}
            onOpen={() => navigate("/referrals")}
          />
          <HistoryButton onOpen={() => setSheet("history")} />
          <GuideButton onOpen={() => navigate("/guide")} />
        </>
      )}

      <DonorLevelsSheet
        open={sheet === "levels"}
        total={total}
        onClose={closeSheet}
      />
      <DonationHistorySheet open={sheet === "history"} onClose={closeSheet} />
      <DonorCodeSheet
        code={blood.donor_code}
        open={sheet === "code"}
        onClose={closeSheet}
        onCopy={copyCode}
      />
      <RegionSheet
        open={sheet === "region"}
        selectedId={me.data.region?.id ?? null}
        onSelect={selectRegion}
        onClose={closeSheet}
      />
      <DemoMenuSheet
        open={sheet === "demo"}
        hasAppointment={Boolean(current.data?.appointment)}
        pending={demoPending}
        onClose={closeSheet}
        onAction={runDemo}
      />
      <DonationTypeSheet
        kind={typeSheet}
        count={typeSheet ? goals[typeSheet].count : 0}
        goal={typeSheet ? goals[typeSheet].goal : 0}
        whole={honorary.whole.count}
        plasma={honorary.plasma.count}
        onClose={() => setTypeSheet(null)}
      />
      <Toast message={toast.message} />
    </Screen>
  );
};
