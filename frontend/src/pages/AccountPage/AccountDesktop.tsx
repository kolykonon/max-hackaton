import { Avatar } from "@maxhub/max-ui";
import {
  ArrowRight,
  Award,
  ChevronRight,
  Clock,
  Copy,
  HeartHandshake,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";

import type { Me, Progress } from "@/api/types";
import { DonationIcon } from "@/components/shared/DonationIcon/DonationIcon";
import { getAbo, getRhesus } from "@/content/bloodGroups";
import { DONATION_TYPE_INFO } from "@/content/donationTypes";
import {
  IMPACT_EXPLANATION,
  PATIENTS_PER_WHOLE_BLOOD,
  getHelpedPatients,
} from "@/content/impact";
import { DONOR_LEVELS, SCALE_LEVELS, getLevelIndex } from "@/content/levels";
import type { DonationKind } from "@/content/types";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/utils/cn";
import { DONATION_FORMS, formatYearsMonths, plural } from "@/utils/format";

import styles from "./AccountDesktop.module.scss";

interface AccountDesktopProps {
  me: Me;
  progress: Progress;
  onAvatarClick: () => void;
  onCopyCode: () => void;
  onOpenLevels: () => void;
  onOpenHistory: () => void;
  onOpenType: (kind: DonationKind) => void;
  onOpenHonorary: () => void;
  onOpenReferrals: () => void;
}

const KINDS: DonationKind[] = ["whole_blood", "plasma", "mixed"];
const RING_R = 54;
const RING_LEN = 2 * Math.PI * RING_R;
const PATIENT_FORMS: [string, string, string] = [
  "пациенту",
  "пациентам",
  "пациентам",
];

/** Доля пути по шкале 1 · 5 · 10 · 20 · 40, точки стоят на равном расстоянии. */
const scalePercent = (total: number): number => {
  const t = SCALE_LEVELS.map((level) => level.threshold);
  if (total < t[0]) return 0;
  if (total >= t[t.length - 1]) return 100;
  const i = t.findLastIndex((threshold) => total >= threshold);
  return ((i + (total - t[i]) / (t[i + 1] - t[i])) / (t.length - 1)) * 100;
};

/** Личный кабинет на ПК: отдельная раскладка-дашборд, логика та же, что на телефоне. */
export const AccountDesktop = ({
  me,
  progress,
  onAvatarClick,
  onCopyCode,
  onOpenLevels,
  onOpenHistory,
  onOpenType,
  onOpenHonorary,
  onOpenReferrals,
}: AccountDesktopProps) => {
  const { total, honorary } = progress;
  const { blood } = me;
  const levelIndex = getLevelIndex(total);
  const next = DONOR_LEVELS[levelIndex + 1];
  const name = [me.first_name, me.last_name].filter(Boolean).join(" ");
  const initials = `${me.first_name[0] ?? ""}${me.last_name?.[0] ?? ""}`;
  const goals = {
    whole_blood: honorary.whole,
    plasma: honorary.plasma,
    mixed: honorary.mixed,
  };
  const helped = getHelpedPatients(honorary.whole.count, honorary.plasma.count);
  const helpedShown = useCountUp(helped);

  return (
    <div className={styles.desk}>
      <section className={cn(styles.hero, styles.appear)}>
        <div className={styles.hero__top}>
          <button
            type="button"
            className={styles.hero__avatar}
            aria-label="Фото профиля"
            onClick={onAvatarClick}
          >
            <Avatar.Container size={88} form="circle">
              {me.photo_url ? (
                <Avatar.Image
                  src={me.photo_url}
                  alt=""
                  fallback={initials}
                  fallbackGradient="blue"
                />
              ) : (
                <Avatar.Text gradient="blue">{initials}</Avatar.Text>
              )}
            </Avatar.Container>
          </button>
          <div className={styles.hero__who}>
            <h1 className={styles.hero__name}>{name}</h1>
            <button
              type="button"
              className={styles.hero__level}
              onClick={onOpenLevels}
            >
              <Award size={18} />
              {DONOR_LEVELS[levelIndex].name}
              <ChevronRight size={16} />
            </button>
          </div>
          <div
            className={styles.hero__impact}
            title={IMPACT_EXPLANATION}
            aria-label={
              helped > 0
                ? `Ваши донации помогли до ${helped} ${plural(helped, PATIENT_FORMS)}`
                : `Первая донация поможет до ${PATIENTS_PER_WHOLE_BLOOD} пациентам`
            }
          >
            <span className={styles["hero__impact-value"]} aria-hidden>
              <HeartHandshake size={28} />
              до {helped > 0 ? helpedShown : PATIENTS_PER_WHOLE_BLOOD}
            </span>
            <span className={styles["hero__total-label"]} aria-hidden>
              {helped > 0
                ? `${plural(helped, PATIENT_FORMS)} помогла ваша кровь`
                : "пациентам поможет первая донация"}
            </span>
          </div>
          <div className={styles.hero__total}>
            <span className={styles["hero__total-value"]}>{total}</span>
            <span className={styles["hero__total-label"]}>
              {plural(total, DONATION_FORMS)}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.scale}
          onClick={onOpenLevels}
          aria-label="Шкала уровней"
        >
          <span className={styles.scale__track}>
            <span
              className={styles.scale__fill}
              style={{ width: `${scalePercent(total)}%` }}
            />
          </span>
          <span className={styles.scale__points}>
            {SCALE_LEVELS.map((level) => (
              <span
                key={level.code}
                className={cn(
                  styles.scale__point,
                  total >= level.threshold && styles["scale__point--done"],
                )}
              >
                <span className={styles.scale__dot} />
                <span className={styles.scale__num}>{level.threshold}</span>
                <span className={styles.scale__name}>{level.name}</span>
              </span>
            ))}
          </span>
        </button>
        <p className={styles.hero__caption}>
          {total === 0
            ? "Сдайте кровь первый раз — и получите уровень «Новичок»"
            : next
              ? `До уровня «${next.name}» осталось ${next.threshold - total}`
              : "Максимальный уровень — вы легенда"}
        </p>
      </section>

      <section className={cn(styles.panel, styles.honorary, styles.appear)}>
        <header className={styles.panel__head}>
          <h2 className={styles.panel__title}>
            Путь к званию «Почётный донор России»
          </h2>
        </header>
        {honorary.achieved ? (
          <div className={styles.achieved}>
            <span className={styles.achieved__medal}>🏅</span>
            <p>Вы набрали донации для звания «Почётный донор России»</p>
            <button
              type="button"
              className={styles.cta}
              onClick={onOpenHonorary}
            >
              Подробнее <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className={styles.rings}>
              {KINDS.map((kind) => {
                const { count, goal } = goals[kind];
                const offset = RING_LEN * (1 - Math.min(count / goal, 1));
                return (
                  <button
                    key={kind}
                    type="button"
                    className={styles.ring}
                    onClick={() => onOpenType(kind)}
                  >
                    <span className={styles.ring__chart}>
                      <svg viewBox="0 0 128 128" aria-hidden>
                        {kind === "mixed" && (
                          <defs>
                            <linearGradient
                              id="ring-mixed"
                              x1="0"
                              x2="1"
                              y1="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#d8222d" />
                              <stop offset="100%" stopColor="#f6b73c" />
                            </linearGradient>
                          </defs>
                        )}
                        <circle
                          cx="64"
                          cy="64"
                          r={RING_R}
                          className={styles.ring__bg}
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r={RING_R}
                          className={cn(
                            styles.ring__bar,
                            styles[`ring__bar--${kind}`],
                          )}
                          style={
                            {
                              strokeDasharray: RING_LEN,
                              strokeDashoffset: offset,
                              "--ring-len": RING_LEN,
                            } as CSSProperties
                          }
                        />
                      </svg>
                      <span className={styles.ring__center}>
                        <DonationIcon kind={kind} size={22} />
                        <b>{count}</b>
                        <small>из {goal}</small>
                      </span>
                    </span>
                    <span className={styles.ring__title}>
                      {DONATION_TYPE_INFO[kind].cardTitle}
                      <ChevronRight size={16} />
                    </span>
                    {kind === "mixed" && honorary.mixed.goal === 60 && (
                      <span className={styles.ring__hint}>
                        Ещё {honorary.mixed.whole_needed_for_40} сдач цельной
                        крови — и цель сократится до 40
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {honorary.eta && (
              <div className={styles.eta}>
                <div>
                  <p className={styles.eta__label}>До звания примерно</p>
                  <p className={styles.eta__value}>
                    {formatYearsMonths(honorary.eta.years, honorary.eta.months)}
                  </p>
                  <p className={styles.eta__note}>
                    Если сдавать кровь и плазму так часто, как разрешено
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={onOpenHonorary}
                >
                  Подробнее <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className={cn(styles.donor, styles.appear)}>
        <div className={styles.donor__head}>
          <span>Карта донора</span>
          <span className={styles.donor__demo}>Демо-данные</span>
        </div>
        <div className={styles.donor__group}>
          <span className={styles["donor__group-value"]}>
            {blood.group ? getAbo(blood.group) : "—"}
          </span>
          <span className={styles["donor__group-rh"]}>
            {blood.group ? getRhesus(blood.group) : ""}
          </span>
        </div>
        <dl className={styles.donor__stats}>
          <div>
            <dt>Kell</dt>
            <dd>{blood.kell?.replace("-", "−") || "—"}</dd>
          </div>
          <div>
            <dt>Фенотип</dt>
            <dd>{blood.phenotype || "—"}</dd>
          </div>
        </dl>
        {blood.donor_code && (
          <button
            type="button"
            className={styles.donor__code}
            onClick={onCopyCode}
            aria-label="Скопировать код донора"
          >
            <span>
              <small>Код донора</small>
              {blood.donor_code}
            </span>
            <Copy size={18} />
          </button>
        )}
      </section>

      <button
        type="button"
        className={cn(styles.tile, styles.appear)}
        onClick={onOpenReferrals}
      >
        <span className={cn(styles.tile__icon, styles["tile__icon--blue"])}>
          <Users size={26} />
        </span>
        <span className={styles.tile__text}>
          <b>
            {me.referrals_count > 0
              ? `Вы пригласили ${me.referrals_count} ${plural(me.referrals_count, ["друга", "друзей", "друзей"])}`
              : "Пригласите друзей"}
          </b>
          <small>Одна донация может спасти до трёх жизней</small>
        </span>
        <ArrowRight size={22} className={styles.tile__arrow} />
      </button>

      <button
        type="button"
        className={cn(styles.tile, styles.appear)}
        onClick={onOpenHistory}
      >
        <span className={cn(styles.tile__icon, styles["tile__icon--red"])}>
          <Clock size={26} />
        </span>
        <span className={styles.tile__text}>
          <b>История донаций</b>
          <small>Все сдачи крови и плазмы с датами и центрами</small>
        </span>
        <ArrowRight size={22} className={styles.tile__arrow} />
      </button>
    </div>
  );
};
