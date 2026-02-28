"""
Property-Based Test — Property 26: Multilingual Form Accuracy

Design Reference:
  "For any form data, the information should remain consistent and accurate
   across different language explanations and interfaces."
  (design.md § Property 26, Validates: Requirements 7.4)

Strategy:
  We use Hypothesis to generate random form field entries (field_id, field_name,
  value) paired with random combinations of two SupportedLanguage codes.
  The test asserts that:
    1. Core data values (field_id, field_name, value) are IDENTICAL regardless
       of which language tag is attached to the FormFieldData object.
    2. The Pydantic schema can be serialised to JSON and deserialised back
       without any data mutation under any language setting.
    3. Switching the language of an existing FormFieldData does NOT change
       its data‐carrying fields.

  This directly tests the "data layer" property — that language is purely
  a *presentation* attribute and can never corrupt field values.

Minimum iterations: 100 (enforced via @settings(max_examples=100))
"""

import json

import pytest
from hypothesis import HealthCheck, given, settings as h_settings, assume
from hypothesis import strategies as st

from app.models.enums import SupportedLanguage
from app.schemas.form import FormFieldData


# ── Hypothesis strategies ─────────────────────────────────────────────────────

# All valid SupportedLanguage values
_LANGUAGES = [lang for lang in SupportedLanguage]

# Printable ASCII text strategy for field names/IDs (excluding control chars)
_printable = st.text(
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd"),
        whitelist_characters="_-",
    ),
    min_size=1,
    max_size=80,
)

# General text for values — allows unicode (names, numbers, dates in locale formats)
_field_value = st.text(min_size=0, max_size=500)

_language_pair = st.tuples(
    st.sampled_from(_LANGUAGES),
    st.sampled_from(_LANGUAGES),
)


# ── Property 26 test ──────────────────────────────────────────────────────────

@given(
    field_id=_printable,
    field_name=_printable,
    field_value=_field_value,
    lang_pair=_language_pair,
)
@h_settings(
    max_examples=100,          # minimum 100 per requirement
    suppress_health_check=[HealthCheck.too_slow],
)
def test_property_26_field_values_unchanged_across_languages(
    field_id: str,
    field_name: str,
    field_value: str,
    lang_pair: tuple[SupportedLanguage, SupportedLanguage],
):
    """
    Property 26: No matter which language is set on a FormFieldData,
    the actual data (field_id, field_name, value) must remain unchanged.

    Feature: government-form-assistant, Property 26: Multilingual Form Accuracy
    """
    lang_a, lang_b = lang_pair

    # Create the same field entry with two different language settings
    entry_a = FormFieldData(
        field_id=field_id,
        field_name=field_name,
        value=field_value,
        language=lang_a,
    )
    entry_b = FormFieldData(
        field_id=field_id,
        field_name=field_name,
        value=field_value,
        language=lang_b,
    )

    # ── Assertion 1: data fields are identical ────────────────────────────
    assert entry_a.field_id == entry_b.field_id, (
        f"field_id changed when language changed from {lang_a} to {lang_b}"
    )
    assert entry_a.field_name == entry_b.field_name, (
        f"field_name changed when language changed from {lang_a} to {lang_b}"
    )
    assert entry_a.value == entry_b.value, (
        f"value changed when language changed from {lang_a} to {lang_b}"
    )


@given(
    field_id=_printable,
    field_name=_printable,
    field_value=_field_value,
    lang_pair=_language_pair,
)
@h_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
)
def test_property_26_serialise_deserialise_invariance(
    field_id: str,
    field_name: str,
    field_value: str,
    lang_pair: tuple[SupportedLanguage, SupportedLanguage],
):
    """
    Property 26 (serialisation variant): A FormFieldData serialised to JSON
    and parsed back must contain identical data values regardless of which
    language was set at the time of serialisation.

    Feature: government-form-assistant, Property 26: Multilingual Form Accuracy
    """
    lang_a, lang_b = lang_pair

    original = FormFieldData(
        field_id=field_id,
        field_name=field_name,
        value=field_value,
        language=lang_a,
    )

    # Serialise → deserialise (simulates API round-trip)
    serialised = original.model_dump_json()
    restored = FormFieldData.model_validate_json(serialised)

    # Restore with a DIFFERENT language (simulates UI language switch after save)
    restored_other_lang = FormFieldData(
        field_id=restored.field_id,
        field_name=restored.field_name,
        value=restored.value,
        language=lang_b,
    )

    # Data must survive the round-trip and language switch
    assert restored.field_id == original.field_id
    assert restored.field_name == original.field_name
    assert restored.value == original.value
    assert restored_other_lang.value == original.value, (
        "Value was mutated after deserialisation + language switch"
    )


@given(
    field_id=_printable,
    field_name=_printable,
    field_value=_field_value,
    lang_pair=_language_pair,
)
@h_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
)
def test_property_26_confirmed_flag_independent_of_language(
    field_id: str,
    field_name: str,
    field_value: str,
    lang_pair: tuple[SupportedLanguage, SupportedLanguage],
):
    """
    Property 26 (confirmation variant): The user-confirmation flag must be
    preserved unchanged when language context is switched.

    Feature: government-form-assistant, Property 26: Multilingual Form Accuracy
    """
    lang_a, lang_b = lang_pair

    # Start confirmed in language A
    confirmed = FormFieldData(
        field_id=field_id,
        field_name=field_name,
        value=field_value,
        confirmed=True,
        language=lang_a,
    )

    # Represent the same entry in language B
    in_other_lang = FormFieldData(
        field_id=confirmed.field_id,
        field_name=confirmed.field_name,
        value=confirmed.value,
        confirmed=confirmed.confirmed,
        language=lang_b,
    )

    assert in_other_lang.confirmed == confirmed.confirmed, (
        "Confirmation flag changed during language switch"
    )
    assert in_other_lang.value == confirmed.value
