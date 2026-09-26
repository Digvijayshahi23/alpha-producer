import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .fastexpr import parse, data_fields, ParseError
from ..db.duck import Catalog
from ..db.models import LocalAlpha

class PyramidResolver:
    """Resolves alpha expressions and metadata to pyramid combinations."""

    def __init__(self, catalog: Catalog):
        self.catalog = catalog

    async def resolve_expression(self, expression: str, region: str, delay: int) -> list[dict[str, Any]]:
        """Finds pyramid categories for an expression based on its fields."""
        try:
            tree = parse(expression)
            fields = data_fields(tree)
        except ParseError:
            return []

        if not fields:
            return []

        field_list = "', '".join(f.replace("'", "''") for f in fields)
        query = f"""
            SELECT DISTINCT category_id, category_name 
            FROM data_field 
            WHERE region = '{region}' 
              AND delay = {delay}
              AND field_id IN ('{field_list}')
              AND category_id IS NOT NULL
        """
        rows = await self.catalog.query(query)
        
        pyramids = []
        for row in rows:
            pyramids.append({
                "region": region,
                "delay": delay,
                "categoryId": row["category_id"],
                "categoryName": row["category_name"]
            })
        return pyramids

    async def get_local_alphas_for_pyramid(self, session: AsyncSession, region: str, delay: int, category_id: str) -> list[LocalAlpha]:
        """Finds local alphas that belong to a specific pyramid.
        Since local_alpha doesn't store delay directly, we map by region, and check fields.
        """
        result = await session.execute(
            select(LocalAlpha).where(LocalAlpha.region == region)
        )
        alphas = result.scalars().all()
        
        matched = []
        for alpha in alphas:
            pyramids = await self.resolve_expression(alpha.expression, region, delay)
            if any(p["categoryId"] == category_id for p in pyramids):
                matched.append(alpha)
        return matched

    async def get_pyramid_local_counts(self, session: AsyncSession) -> dict[tuple[str, int, str], int]:
        """Returns a mapping of (region, delay, category_id) -> count of local alphas."""
        result = await session.execute(select(LocalAlpha))
        alphas = result.scalars().all()

        counts = {}
        for alpha in alphas:
            if not alpha.region:
                continue
            
            # Since local alphas lack delay, we assume they apply to all delays or D1 by default?
            # Actually, delays are typically 0 or 1. Let's resolve for both if universe/delay is absent.
            # But wait, local alpha doesn't have delay. We'll resolve for delay 1 which is standard.
            # Wait, if we want to be exact, we should resolve for delay=0 and delay=1.
            delays = [0, 1]
            for d in delays:
                pyramids = await self.resolve_expression(alpha.expression, alpha.region, d)
                for p in pyramids:
                    key = (p["region"], p["delay"], p["categoryId"])
                    counts[key] = counts.get(key, 0) + 1
        return counts
