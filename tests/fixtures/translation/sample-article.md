---
contentId: "SDW-001-EN"
translationKey: "SDW-001"
language: "en"
translationOf: null
translationStatus: "source"
sourceRevision: 1
title: "A green dbt check is not proof"
description: "What a successful workflow run proves about your data pipeline — and what it does not."
publishedAt: 2026-09-01
updatedAt: null
draft: false
pillar:
  - Evaluate
audience:
  - Analytics Engineers
tags:
  - dbt
  - Data Quality
repositoryUrl: "https://github.com/example/quality-gates"
releaseUrl: null
evidenceUrl: "https://example.com/evidence/2026-09"
youtubeId: null
---

## A green dbt check is not proof

A successful workflow run only proves that the process **completed**, not that the result is correct. Roughly 73% of all data quality incidents in our evidence report were caused by schema drift, and 1,234 rows were affected in a single release. Teams that treat a green check as release approval ship broken contracts about 0.25 times per sprint.

Read the [quality gate documentation](https://example.com/quality-gates) for the full checklist, and compare with the release notes for v1.0.2 before you merge the Pull Request.

- Run `dbt build --select +customers` before every merge.
- Check the freshness of the source tables in Snowflake.
- Escalate to the data platform team if the Pull Request stays red for more than 24 hours.

| Signal | Meaning |
| --- | --- |
| Green check | The SQL executed without errors |
| Red check | The SQL failed and needs investigation |

> Trust the evidence, not the exit code: a green dbt check is a data point, not a decision.

![Pipeline overview diagram](https://example.com/images/pipeline-overview.png)

```sql
select
  customer_id,
  count(*) as order_count
from orders
group by 1
```
