import re
import pandas as pd
import numpy as np

def clean_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Cleans raw uploaded dataframe safely without silent data loss.
    Returns cleaned_df and detailed cleaning summary dictionary.
    """
    raw_df = df.copy()
    rows_before = len(raw_df)
    cols_before = len(raw_df.columns)
    missing_before = int(raw_df.isnull().sum().sum())
    duplicates_before = int(raw_df.duplicated().sum())

    cleaned_df = df.copy()
    columns_modified = []

    # 1. Clean Column Names (strip whitespace, ensure uniqueness)
    new_cols = []
    seen_cols = {}
    for col in cleaned_df.columns:
        clean_name = str(col).strip()
        if clean_name in seen_cols:
            seen_cols[clean_name] += 1
            clean_name = f"{clean_name}_{seen_cols[clean_name]}"
        else:
            seen_cols[clean_name] = 0
        new_cols.append(clean_name)
    cleaned_df.columns = new_cols

    # 2. Drop completely empty columns and rows
    cleaned_df.dropna(how="all", axis=1, inplace=True)
    cleaned_df.dropna(how="all", axis=0, inplace=True)

    # 3. Remove duplicate rows
    cleaned_df.drop_duplicates(inplace=True)
    duplicates_removed = int(rows_before - len(cleaned_df))

    # 4. Standardize text and attempt numeric type conversions
    for col in cleaned_df.columns:
        # If object or string
        if cleaned_df[col].dtype == "object":
            # Strip whitespace
            try:
                cleaned_df[col] = cleaned_df[col].astype(str).str.strip()
                # Replace 'nan', 'None', 'NULL', 'null', '' with actual np.nan
                cleaned_df[col] = cleaned_df[col].replace(["nan", "None", "NULL", "null", "N/A", "na", ""], np.nan)
            except Exception:
                pass

            # Check if this column might actually be numeric (e.g. currency, percent, or comma numbers)
            non_nulls = cleaned_df[col].dropna()
            if len(non_nulls) > 0:
                sample = non_nulls.head(50).astype(str)
                # Check if values look like numbers with $, %, commas
                is_numeric_like = sample.apply(lambda v: bool(re.match(r"^[\$€£]?\s*-?\d+([.,]\d+)?\s*%?$", v.strip()))).mean() > 0.8
                if is_numeric_like:
                    try:
                        converted = non_nulls.astype(str).str.replace(r"[\$,€£%]", "", regex=True).str.replace(",", "")
                        cleaned_df[col] = pd.to_numeric(converted, errors="coerce")
                        columns_modified.append(f"{col} (coerced to numeric)")
                    except Exception:
                        pass

    # 5. Handle Missing Values
    numeric_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = cleaned_df.select_dtypes(exclude=[np.number]).columns.tolist()

    for col in numeric_cols:
        null_count = int(cleaned_df[col].isnull().sum())
        if null_count > 0:
            median_val = cleaned_df[col].median()
            if pd.isna(median_val):
                median_val = 0
            cleaned_df[col] = cleaned_df[col].fillna(median_val)
            columns_modified.append(f"{col} (imputed {null_count} missing with median {round(float(median_val), 2)})")

    for col in categorical_cols:
        null_count = int(cleaned_df[col].isnull().sum())
        if null_count > 0:
            mode_series = cleaned_df[col].mode()
            fill_val = str(mode_series.iloc[0]) if len(mode_series) > 0 else "Unknown"
            cleaned_df[col] = cleaned_df[col].fillna(fill_val)
            columns_modified.append(f"{col} (imputed {null_count} missing with mode '{fill_val}')")

    rows_after = len(cleaned_df)
    missing_after = int(cleaned_df.isnull().sum().sum())

    summary = {
        "rows_before": rows_before,
        "rows_after": rows_after,
        "columns_before": cols_before,
        "columns_after": len(cleaned_df.columns),
        "missing_values_before": missing_before,
        "missing_values_after": missing_after,
        "duplicates_removed": duplicates_removed,
        "columns_modified": list(set(columns_modified))
    }

    return cleaned_df, summary
