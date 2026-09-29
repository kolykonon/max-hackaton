"""«Вклад» донора: литры и сколько людям могли помочь донации.

Цифры — только с источником. Если источника нет, не считаем.
"""

from dataclasses import dataclass

# Цельная кровь: «донор сдает кровь в объеме 450 ± 10% мл» (kkck.ru)
WHOLE_BLOOD_LITERS = 0.45
# Плазма: «от одного донора получают до 750 мл. плазмы» (kkck.ru) — верхняя граница
PLASMA_LITERS_MAX = 0.75
# «одной своей кроводачей вы можете спасти трёх человек: одному пойдет ваша кровь,
# другому – плазма, третьему – тромбоциты» (nrcerm.ru). Только для цельной крови:
# для плазмы источника с числом пациентов нет — не считаем
PATIENTS_PER_WHOLE_BLOOD_MAX = 3


@dataclass(frozen=True)
class ImpactSource:
    title: str
    url: str
    claim: str


SOURCES: list[ImpactSource] = [
    ImpactSource(
        title="ВЦЭРМ им. А. М. Никифорова МЧС России — «Мифы и факты о донорстве крови»",
        url="https://nrcerm.ru/patient-guide/live-healthy/blood-donation/",
        claim=(
            "Одной кроводачей можно помочь трём людям: одному — кровь, "
            "другому — плазма, третьему — тромбоциты"
        ),
    ),
    ImpactSource(
        title="Красноярский краевой центр крови № 1 — «Виды донаций»",
        url="https://kkck.ru/donor/vidy-donacij/",
        claim="Цельная кровь — 450 ± 10% мл за донацию, плазма — до 750 мл",
    ),
]


@dataclass(frozen=True)
class ImpactNumbers:
    whole_count: int
    plasma_count: int

    @property
    def whole_liters(self) -> float:
        return round(self.whole_count * WHOLE_BLOOD_LITERS, 2)

    @property
    def plasma_liters_max(self) -> float:
        return round(self.plasma_count * PLASMA_LITERS_MAX, 2)

    @property
    def total_liters_max(self) -> float:
        return round(self.whole_liters + self.plasma_liters_max, 2)

    @property
    def patients_helped_max(self) -> int:
        return self.whole_count * PATIENTS_PER_WHOLE_BLOOD_MAX
