# Risk Categories Update

## Overview
Updated all risk categories across the application to match the new standardized list. Old categories have been replaced with the new approved categories.

## New Risk Categories

The application now uses the following 8 risk categories:

1. **Safety** - Risks related to health, safety, and wellbeing
2. **Security** - Physical and digital security threats
3. **Fiduciary** - Financial management and fiduciary responsibilities
4. **Legal / Compliance** - Legal obligations and regulatory compliance
5. **Operational** - Day-to-day operational risks
6. **Reputational** - Brand and reputation risks
7. **Information** - Data and information management risks
8. **Ethical** - Ethics and integrity-related risks

## Old Categories Removed

The following categories were removed from the system:
- ❌ Financial (replaced with → **Fiduciary**)
- ❌ Strategic (no direct replacement, use → **Safety** for now)
- ❌ Compliance (merged into → **Legal / Compliance**)
- ❌ Environmental (no direct replacement, use → **Safety** for now)
- ❌ Partnership (no direct replacement, use → **Safety** for now)

## Files Updated

### 1. **NewRiskModal.tsx** (`src/components/my-risks/NewRiskModal.tsx`)
- Updated `riskCategories` array with new categories
- Used for creating new risks in "My Risks" page

### 2. **EditRiskModal.tsx** (`src/components/risk-review/EditRiskModal.tsx`)
- Updated `CATEGORY_OPTIONS` array
- Used for editing risks in Risk Review page

### 3. **Risk Review Page** (`src/app/risk-review/page.tsx`)
- Updated `CATEGORIES` array for filtering
- Category filter dropdown now shows new categories

### 4. **SharedRisksHeader.tsx** (`src/components/shared-risks/SharedRisksHeader.tsx`)
- Updated `categoryOptions` array
- Category filter for Shared Risks page

### 5. **RisksLibraryHeader.tsx** (`src/components/risks-library/RisksLibraryHeader.tsx`)
- Updated `categoryOptions` array
- Added all 8 new categories (previously was empty/placeholder)

### 6. **RisksLibraryTable.tsx** (`src/components/risks-library/RisksLibraryTable.tsx`)
- Updated sample data: "Financial" → "Safety"
- Sample/demo data now uses new categories

## Category Value Format

All category values use lowercase with underscores:
- `safety`
- `security`
- `fiduciary`
- `legal_compliance` (note: underscore instead of space/slash)
- `operational`
- `reputational`
- `information`
- `ethical`

## Migration Notes

### For Existing Risks in Database

Existing risks with old categories will need to be migrated:

**Recommended Mapping:**
- `financial` → `fiduciary`
- `strategic` → `safety` (temporary, review individually)
- `compliance` → `legal_compliance`
- `environmental` → `safety` (temporary, review individually)
- `partnership` → `safety` (temporary, review individually)
- `operational` → `operational` (no change)
- `reputational` → `reputational` (no change)
- `security` → `security` (no change)

### Database Migration Script Needed

You may need to run a database migration to update existing risk records. Example:

```javascript
// Pseudocode for migration
db.risks.updateMany(
  { category: 'financial' },
  { $set: { category: 'fiduciary' } }
);

db.risks.updateMany(
  { category: 'compliance' },
  { $set: { category: 'legal_compliance' } }
);

db.risks.updateMany(
  { category: { $in: ['strategic', 'environmental', 'partnership'] } },
  { $set: { category: 'safety' } }
);
```

## Testing Checklist

- [x] Build completed successfully with no errors
- [ ] Test creating new risk with each category
- [ ] Test editing existing risk categories
- [ ] Test filtering by category on Risk Review page
- [ ] Test filtering by category on Shared Risks page
- [ ] Test filtering by category on Risks Library page
- [ ] Verify category badges display correctly on risk cards
- [ ] Test category dropdown selections on all forms

## Impact

### Positive Changes:
✅ More relevant and specific categories for nonprofit consortium risks
✅ Clearer separation between different risk types
✅ Better alignment with industry standards for nonprofit risk management
✅ Reduced category overlap and confusion

### Breaking Changes:
⚠️ **Existing risks with old categories will need to be updated**
⚠️ Any API integrations expecting old category names will break
⚠️ Filters or searches using old category names will return no results

## Recommendations

1. **Data Migration**: Run database migration script before deploying to production
2. **User Communication**: Notify users of category changes before deployment
3. **Review Mapped Risks**: Risks automatically mapped to "Safety" should be reviewed individually
4. **Update Documentation**: Update any user guides or training materials with new categories
5. **API Versioning**: Consider API versioning if external systems depend on category names
