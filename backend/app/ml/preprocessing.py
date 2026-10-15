from typing import Tuple, List, Optional
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

class PreprocessingPipeline:
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.target_column = None

    def prepare_features(
        self,
        df: pd.DataFrame,
        target_col: Optional[str] = None,
        drop_cols: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, Optional[np.ndarray], List[str]]:
        data = df.copy()
        
        default_drops = ["employee_id", "empid", "id", "name", "employee_name", "raw_data_json", "created_at"]
        all_drops = set((drop_cols or []) + default_drops)
        if target_col and target_col in data.columns:
            all_drops.add(target_col)

        feature_df = data.drop(columns=[c for c in all_drops if c in data.columns])

        # Prepare target y
        y = None
        if target_col and target_col in data.columns:
            y_raw = data[target_col].copy()
            if not pd.api.types.is_numeric_dtype(y_raw):
                y_norm = y_raw.astype(str).str.strip().str.lower()
                y = y_norm.apply(lambda v: 1 if v in ["yes", "1", "true", "left", "exited", "resigned"] else 0).values
            else:
                y = pd.to_numeric(y_raw, errors="coerce").fillna(0).astype(int).values

        # Encode features
        processed_features = pd.DataFrame(index=feature_df.index)
        for col in feature_df.columns:
            series = feature_df[col]
            if not pd.api.types.is_numeric_dtype(series):
                series_str = series.fillna("Unknown").astype(str)
                le = LabelEncoder()
                processed_features[col] = le.fit_transform(series_str)
                self.label_encoders[col] = le
            else:
                s_numeric = pd.to_numeric(series, errors="coerce")
                fill_val = s_numeric.median() if pd.notna(s_numeric.median()) else 0
                processed_features[col] = s_numeric.fillna(fill_val)

        self.feature_columns = processed_features.columns.tolist()
        X_scaled = self.scaler.fit_transform(processed_features)
        return X_scaled, y, self.feature_columns

    def transform_new_data(self, df: pd.DataFrame) -> np.ndarray:
        processed = pd.DataFrame(index=df.index)
        for col in self.feature_columns:
            if col in df.columns:
                series = df[col]
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    series_str = series.fillna("Unknown").astype(str)
                    classes = set(le.classes_)
                    clean_str = series_str.apply(lambda x: x if x in classes else le.classes_[0])
                    processed[col] = le.transform(clean_str)
                else:
                    processed[col] = pd.to_numeric(series, errors="coerce").fillna(0)
            else:
                processed[col] = 0

        return self.scaler.transform(processed)
