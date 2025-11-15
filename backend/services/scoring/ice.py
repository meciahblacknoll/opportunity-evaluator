"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: ChatGPT ICE scoring spec
Author: Claude Code

ICE (Impact, Confidence, Ease) scoring for Phase 2.
Deterministic scoring alternative to composite ROI scoring.
"""

from typing import List, Dict, Any, Tuple


def calculate_ice_score(impact: int, confidence: int, ease: int) -> float:
    """
    Calculate raw ICE score.

    Formula: (Impact * Confidence) / max(Ease, 1)

    Args:
        impact: Impact score (0-10)
        confidence: Confidence score (0-10)
        ease: Ease score (0-10)

    Returns:
        Raw ICE score (higher is better)

    Example:
        >>> calculate_ice_score(9, 9, 5)
        16.2  # High impact, high confidence, medium ease
    """
    return (impact * confidence) / max(ease, 1)


def normalize_scores(scores: List[float]) -> List[float]:
    """
    Normalize scores to 0-1 scale using min-max normalization.

    Args:
        scores: List of raw scores

    Returns:
        List of normalized scores (0-1)

    Example:
        >>> normalize_scores([10, 20, 30])
        [0.0, 0.5, 1.0]
    """
    if not scores or len(scores) == 0:
        return []

    min_score = min(scores)
    max_score = max(scores)

    # Handle edge case where all scores are the same
    if max_score == min_score:
        return [0.5] * len(scores)  # All get middle score

    # Normalize to 0-1 scale
    return [
        (score - min_score) / (max_score - min_score)
        for score in scores
    ]


def rank_by_ice(
    opportunities: List[Dict[str, Any]]
) -> List[Tuple[Dict[str, Any], float, float]]:
    """
    Rank opportunities by ICE score.

    Args:
        opportunities: List of opportunities with ICE fields

    Returns:
        List of tuples (opportunity, raw_ice_score, normalized_ice_score)
        sorted by normalized score descending

    Example:
        >>> opps = [
        ...     {"id": 1, "impact": 9, "confidence": 8, "ease": 4},
        ...     {"id": 2, "impact": 7, "confidence": 9, "ease": 7}
        ... ]
        >>> ranked = rank_by_ice(opps)
        >>> ranked[0][0]["id"]  # ID of top opportunity
        1
    """
    # Calculate raw ICE scores
    raw_scores = []
    for opp in opportunities:
        impact = opp.get("impact", 5)
        confidence = opp.get("confidence", 5)
        ease = opp.get("ease", 5)

        ice_score = calculate_ice_score(impact, confidence, ease)
        raw_scores.append((opp, ice_score))

    # Normalize
    normalized = normalize_scores([score for _, score in raw_scores])

    # Combine and sort
    ranked = [
        (opp, raw, norm)
        for (opp, raw), norm in zip(raw_scores, normalized)
    ]

    ranked.sort(key=lambda x: x[2], reverse=True)  # Sort by normalized score

    return ranked


def ice_vs_roi_comparison(
    opportunities: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compare ICE ranking vs ROI-based ranking.

    Useful for understanding which scoring method ranks opportunities differently.

    Args:
        opportunities: List of opportunities with both ICE and ROI fields

    Returns:
        Dict with analysis of ranking differences

    Example output:
        {
            "total_opportunities": 10,
            "rank_differences": [
                {"id": 5, "ice_rank": 1, "roi_rank": 5, "difference": 4},
                ...
            ],
            "max_difference": 4,
            "correlation": 0.82
        }
    """
    # Rank by ICE
    ice_ranked = rank_by_ice(opportunities)
    ice_positions = {opp[0]["id"]: idx for idx, opp in enumerate(ice_ranked)}

    # Rank by ROI (using composite score)
    roi_ranked = sorted(
        opportunities,
        key=lambda o: o.get("composite_score", 0),
        reverse=True
    )
    roi_positions = {opp["id"]: idx for idx, opp in enumerate(roi_ranked)}

    # Calculate differences
    differences = []
    for opp_id in ice_positions:
        ice_rank = ice_positions[opp_id]
        roi_rank = roi_positions.get(opp_id, len(opportunities))

        diff = abs(ice_rank - roi_rank)
        differences.append({
            "id": opp_id,
            "ice_rank": ice_rank,
            "roi_rank": roi_rank,
            "difference": diff
        })

    # Sort by largest difference
    differences.sort(key=lambda x: x["difference"], reverse=True)

    # Calculate correlation (simplified)
    max_diff = max([d["difference"] for d in differences]) if differences else 0

    return {
        "total_opportunities": len(opportunities),
        "rank_differences": differences,
        "max_difference": max_diff,
        "avg_difference": sum(d["difference"] for d in differences) / len(differences) if differences else 0
    }


def combined_score(
    ice_score: float,
    roi_score: float,
    ice_weight: float = 0.5
) -> float:
    """
    Combine ICE and ROI scores with configurable weighting.

    Args:
        ice_score: Normalized ICE score (0-1)
        roi_score: Normalized ROI score (0-1)
        ice_weight: Weight for ICE (0-1), ROI gets (1 - ice_weight)

    Returns:
        Combined score (0-1)

    Example:
        >>> combined_score(0.8, 0.6, ice_weight=0.7)
        0.74  # Weighted toward ICE
    """
    roi_weight = 1 - ice_weight
    return (ice_score * ice_weight) + (roi_score * roi_weight)
