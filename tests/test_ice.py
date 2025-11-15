"""
PROVENANCE
Created: 2025-11-14
Prompt: ChatGPT Phase 2 testing guidance
Author: Claude Code

Phase 2 tests for ICE scoring.
"""

import pytest
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.scoring.ice import (
    calculate_ice_score,
    normalize_scores,
    rank_by_ice,
    ice_vs_roi_comparison,
    combined_score
)


class TestICEScoring:
    """Test ICE (Impact, Confidence, Ease) scoring."""

    def test_calculate_ice_score_basic(self):
        """Test basic ICE score calculation."""
        # High impact, high confidence, medium ease
        score = calculate_ice_score(9, 9, 5)
        assert score == 81 / 5
        assert score == 16.2

        # Low impact, low confidence, high ease
        score = calculate_ice_score(2, 2, 8)
        assert score == 4 / 8
        assert score == 0.5

    def test_calculate_ice_score_zero_ease(self):
        """Test ICE score with ease=0 (division by zero protection)."""
        # Should use max(ease, 1) to prevent division by zero
        score = calculate_ice_score(10, 10, 0)
        assert score == 100  # 10 * 10 / max(0, 1) = 100

    def test_calculate_ice_score_edge_cases(self):
        """Test ICE score edge cases."""
        # All zeros
        score = calculate_ice_score(0, 0, 0)
        assert score == 0.0

        # Max values
        score = calculate_ice_score(10, 10, 10)
        assert score == 10.0

        # Ease = 1
        score = calculate_ice_score(5, 6, 1)
        assert score == 30.0


class TestNormalization:
    """Test score normalization."""

    def test_normalize_scores_basic(self):
        """Test basic min-max normalization."""
        scores = [10, 20, 30]
        normalized = normalize_scores(scores)

        assert normalized == [0.0, 0.5, 1.0]

    def test_normalize_scores_all_same(self):
        """Test normalization when all scores are identical."""
        scores = [5, 5, 5, 5]
        normalized = normalize_scores(scores)

        # All should get 0.5 (middle score)
        assert normalized == [0.5, 0.5, 0.5, 0.5]

    def test_normalize_scores_empty(self):
        """Test normalization with empty list."""
        scores = []
        normalized = normalize_scores(scores)

        assert normalized == []

    def test_normalize_scores_single(self):
        """Test normalization with single score."""
        scores = [42]
        normalized = normalize_scores(scores)

        # Single score → gets 0.5
        assert normalized == [0.5]

    def test_normalize_scores_negative(self):
        """Test normalization with negative scores."""
        scores = [-10, 0, 10]
        normalized = normalize_scores(scores)

        assert normalized == [0.0, 0.5, 1.0]

    def test_normalize_scores_large_range(self):
        """Test normalization with large value range."""
        scores = [1, 1000, 2000]
        normalized = normalize_scores(scores)

        assert abs(normalized[0] - 0.0) < 1e-10
        assert abs(normalized[1] - 0.4995) < 0.001
        assert abs(normalized[2] - 1.0) < 1e-10


class TestRanking:
    """Test ICE ranking."""

    def test_rank_by_ice_basic(self):
        """Test basic ICE ranking."""
        opportunities = [
            {"id": 1, "impact": 9, "confidence": 8, "ease": 4},  # 72/4 = 18
            {"id": 2, "impact": 7, "confidence": 9, "ease": 7},  # 63/7 = 9
            {"id": 3, "impact": 10, "confidence": 10, "ease": 5}  # 100/5 = 20
        ]

        ranked = rank_by_ice(opportunities)

        # Should be sorted by normalized score descending
        assert ranked[0][0]["id"] == 3  # Highest raw score (20)
        assert ranked[1][0]["id"] == 1  # Second (18)
        assert ranked[2][0]["id"] == 2  # Lowest (9)

        # Check normalized scores
        _, _, norm1 = ranked[0]
        _, _, norm2 = ranked[1]
        _, _, norm3 = ranked[2]

        assert norm1 == 1.0  # Top gets 1.0
        assert norm3 == 0.0  # Bottom gets 0.0
        assert 0.0 < norm2 < 1.0  # Middle is in between

    def test_rank_by_ice_defaults(self):
        """Test ranking with missing ICE fields (defaults to 5)."""
        opportunities = [
            {"id": 1, "impact": 10, "confidence": 10, "ease": 5},
            {"id": 2},  # All defaults → 5*5/5 = 5
            {"id": 3, "impact": 3, "confidence": 3, "ease": 9}  # 9/9 = 1
        ]

        ranked = rank_by_ice(opportunities)

        # Check that defaults are applied
        assert ranked[0][0]["id"] == 1  # Highest
        assert ranked[1][0]["id"] == 2  # Default (5)
        assert ranked[2][0]["id"] == 3  # Lowest (1)

    def test_rank_by_ice_returns_raw_and_normalized(self):
        """Test that ranking returns both raw and normalized scores."""
        opportunities = [
            {"id": 1, "impact": 8, "confidence": 7, "ease": 4}
        ]

        ranked = rank_by_ice(opportunities)

        opp, raw, norm = ranked[0]

        # Raw score = 8 * 7 / 4 = 14
        assert raw == 14.0

        # Single item → normalized = 0.5
        assert norm == 0.5

    def test_rank_by_ice_empty(self):
        """Test ranking with empty list."""
        opportunities = []
        ranked = rank_by_ice(opportunities)

        assert ranked == []


class TestICEvsROIComparison:
    """Test ICE vs ROI ranking comparison."""

    def test_ice_vs_roi_comparison_basic(self):
        """Test comparison between ICE and ROI rankings."""
        opportunities = [
            {"id": 1, "impact": 9, "confidence": 9, "ease": 3, "composite_score": 0.5},
            {"id": 2, "impact": 5, "confidence": 5, "ease": 9, "composite_score": 0.9},
            {"id": 3, "impact": 7, "confidence": 7, "ease": 5, "composite_score": 0.7}
        ]

        comparison = ice_vs_roi_comparison(opportunities)

        # Should return analysis
        assert comparison["total_opportunities"] == 3
        assert "rank_differences" in comparison
        assert "max_difference" in comparison
        assert "avg_difference" in comparison

        # Check rank differences list
        assert len(comparison["rank_differences"]) == 3

    def test_ice_vs_roi_same_ranking(self):
        """Test when ICE and ROI produce same ranking."""
        opportunities = [
            {"id": 1, "impact": 10, "confidence": 10, "ease": 1, "composite_score": 1.0},
            {"id": 2, "impact": 5, "confidence": 5, "ease": 5, "composite_score": 0.5},
            {"id": 3, "impact": 1, "confidence": 1, "ease": 10, "composite_score": 0.0}
        ]

        comparison = ice_vs_roi_comparison(opportunities)

        # All differences should be 0
        assert comparison["max_difference"] == 0
        assert comparison["avg_difference"] == 0.0

    def test_ice_vs_roi_large_difference(self):
        """Test when ICE and ROI disagree significantly."""
        opportunities = [
            # High ROI, low ICE
            {"id": 1, "impact": 1, "confidence": 1, "ease": 10, "composite_score": 0.9},
            # Low ROI, high ICE
            {"id": 2, "impact": 10, "confidence": 10, "ease": 1, "composite_score": 0.1}
        ]

        comparison = ice_vs_roi_comparison(opportunities)

        # Should have rank differences
        assert comparison["max_difference"] > 0

        # Check specific differences
        diffs = {d["id"]: d["difference"] for d in comparison["rank_differences"]}
        assert diffs[1] == 1  # ID 1 flipped positions
        assert diffs[2] == 1  # ID 2 flipped positions


class TestCombinedScore:
    """Test combined ICE + ROI scoring."""

    def test_combined_score_equal_weight(self):
        """Test combined score with 50/50 weighting."""
        # Equal weight (default)
        score = combined_score(0.8, 0.6, ice_weight=0.5)
        expected = (0.8 * 0.5) + (0.6 * 0.5)
        assert score == expected
        assert score == 0.7

    def test_combined_score_ice_heavy(self):
        """Test combined score weighted toward ICE."""
        score = combined_score(0.8, 0.6, ice_weight=0.7)
        expected = (0.8 * 0.7) + (0.6 * 0.3)
        assert abs(score - expected) < 1e-10
        assert abs(score - 0.74) < 1e-10

    def test_combined_score_roi_heavy(self):
        """Test combined score weighted toward ROI."""
        score = combined_score(0.8, 0.6, ice_weight=0.3)
        expected = (0.8 * 0.3) + (0.6 * 0.7)
        assert abs(score - expected) < 1e-10
        assert abs(score - 0.66) < 1e-10

    def test_combined_score_pure_ice(self):
        """Test combined score with 100% ICE weight."""
        score = combined_score(0.8, 0.6, ice_weight=1.0)
        assert score == 0.8

    def test_combined_score_pure_roi(self):
        """Test combined score with 0% ICE weight."""
        score = combined_score(0.8, 0.6, ice_weight=0.0)
        assert score == 0.6

    def test_combined_score_edge_cases(self):
        """Test combined score edge cases."""
        # Both 0
        score = combined_score(0.0, 0.0)
        assert score == 0.0

        # Both 1
        score = combined_score(1.0, 1.0)
        assert score == 1.0

        # Opposite extremes
        score = combined_score(1.0, 0.0, ice_weight=0.5)
        assert score == 0.5
