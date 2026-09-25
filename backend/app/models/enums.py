from enum import StrEnum


class BloodGroup(StrEnum):
    """Группа крови и резус: 1 = O(I), 2 = A(II), 3 = B(III), 4 = AB(IV)."""

    O_POS = "1+"
    O_NEG = "1-"
    A_POS = "2+"
    A_NEG = "2-"
    B_POS = "3+"
    B_NEG = "3-"
    AB_POS = "4+"
    AB_NEG = "4-"


class DonationType(StrEnum):
    """Вид донации: цельная кровь или плазма."""

    WHOLE_BLOOD = "whole_blood"
    PLASMA = "plasma"
