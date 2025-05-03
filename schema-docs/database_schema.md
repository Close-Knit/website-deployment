# Database Schema Documentation

Last updated: 2025-05-03

This document contains the current schema of all tables in the Supabase database.

## Tables Overview

### System Tables
- `categories`
- `communities`
- `provinces`
- `suggested_changes`

### Province Tables
- `Alberta`
- `British_Columbia`
- `Manitoba`
- `New_Brunswick`
- `Newfoundland_and_Labrador`
- `Northwest_Territories`
- `Nova_Scotia`
- `Nunavut`
- `Ontario`
- `Prince_Edward_Island`
- `Quebec`
- `Saskatchewan`
- `Yukon`

## Table Schemas

### System Tables

#### categories
| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | integer | NO | nextval('categories_id_seq' |  |
| category_name | text | NO |  | The official display name for the category. |
| created_at | timestamp with time zone | YES | now() |  |

#### communities
| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | integer | NO | nextval('communities_id_seq' |  |
| community_name | text | NO |  |  |
| province_id | integer | NO |  |  |
| logo_filename | text | YES |  |  |
| status | text | YES | '''COMING_SOON''' |  |

#### provinces
| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | integer | NO | nextval('provinces_id_seq' |  |
| province_name | text | NO |  |  |

#### suggested_changes
| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | bigint | NO |  |  |
| created_at | timestamp with time zone | NO | now() |  |
| community_id | bigint | YES |  | References the community this suggestion applies to. |
| change_type | text | YES |  | Type of change requested: ADD, CHANGE, or DELETE. |
| status | text | NO | 'PENDING' | Moderation status: PENDING, APPROVED, REJECTED. |
| target_listing_info | text | YES |  | Identifier (usually name) of the existing listing to modify or delete. |
| suggested_name | text | YES |  |  |
| suggested_phone | text | YES |  |  |
| suggested_category | text | YES |  |  |
| suggested_notes | text | YES |  |  |
| suggested_address | text | YES |  | Suggested address for the listing (if applicable). |
| suggested_email | text | YES |  | Suggested email for the listing (if applicable). |
| submitter_comment | text | YES |  |  |
| suggested_website | text | YES |  |  |

### Province Tables

All province tables follow a similar structure. Here's an example from one province:

#### Alberta (Example)
| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | bigint | NO |  |  |
| community_id | bigint | NO |  |  |
| name | text | YES |  |  |
| phone_number | text | YES |  |  |
| category | text | YES |  |  |
| contact_person | text | YES |  |  |
| notes | text | YES |  |  |
| address | text | YES |  |  |
| is_promoted | boolean | YES | false |  |
| promotion_expires_at | timestamp with time zone | YES |  |  |
| promoter_email | text | YES |  |  |
| promotion_duration_months | integer | YES |  |  |
| website_url | text | YES |  |  |
| email | text | YES |  |  |
