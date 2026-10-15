import os
import joblib
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from app.core.config import MODELS_DIR
from app.services.eda_service import detect_semantic_column

SEGMENTATION_MODEL_FILE = os.path.join(MODELS_DIR, "segmentation_model.pkl")

def generate_employee_segments(df: pd.DataFrame, n_clusters: int = 4) -> Dict[str, Any]:
    """
    Performs KMeans clustering on employees using available numeric features
    and assigns dynamic, human-readable segment profiles based on centroid traits.
    """
    feature_candidates = ["age", "salary", "performance", "productivity", "satisfaction", "tenure"]
    cols_to_use = []
    col_names = []

    for key in feature_candidates:
        matched = detect_semantic_column(df, key)
        if matched and matched in df.columns and pd.api.types.is_numeric_dtype(df[matched]):
            cols_to_use.append(matched)
            col_names.append(key)

    if len(cols_to_use) < 2:
        return {
            "success": False,
            "message": "Fewer than 2 numeric features available for workforce segmentation.",
            "clusters": []
        }

    sub_df = df[cols_to_use].copy()
    for col in cols_to_use:
        sub_df[col] = sub_df[col].fillna(sub_df[col].median())

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(sub_df)

    actual_k = min(n_clusters, max(2, len(df) // 20))
    kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    try:
        sil_score = round(float(silhouette_score(X_scaled, labels)), 3)
    except Exception:
        sil_score = 0.0

    # Save model
    joblib.dump({"model": kmeans, "scaler": scaler, "cols": cols_to_use}, SEGMENTATION_MODEL_FILE)

    # Analyze centroids to generate dynamic, human-readable profile names
    # e.g. High Performers, High Potential, Low Engagement, Experienced Workforce
    cluster_profiles = []
    centroids = scaler.inverse_transform(kmeans.cluster_centers_)

    # Global means for comparison
    global_means = sub_df.mean()

    for c_idx in range(actual_k):
        c_mean = centroids[c_idx]
        traits = []
        is_high_perf = False
        is_low_sat = False
        is_experienced = False
        is_high_salary = False

        for f_idx, key in enumerate(col_names):
            val = c_mean[f_idx]
            g_val = global_means[cols_to_use[f_idx]]
            diff_pct = (val - g_val) / (g_val if g_val != 0 else 1)

            if key == "performance" and diff_pct > 0.1:
                is_high_perf = True
                traits.append("High Performance")
            elif key == "satisfaction" and diff_pct < -0.15:
                is_low_sat = True
                traits.append("Low Engagement")
            elif key == "tenure" and diff_pct > 0.2:
                is_experienced = True
                traits.append("Senior Tenure")
            elif key == "age" and diff_pct > 0.2:
                is_experienced = True
                traits.append("Senior Experience")
            elif key == "salary" and diff_pct > 0.2:
                is_high_salary = True
                traits.append("High Compensation")

        # Derive human readable name based on predominant centroid characteristics
        if is_high_perf and is_high_salary:
            name = "Executive & High Performers"
        elif is_high_perf:
            name = "High Potential / Rising Stars"
        elif is_low_sat:
            name = "At-Risk / Low Engagement"
        elif is_experienced:
            name = "Experienced / Core Workforce"
        elif c_idx == 0:
            name = "Core Operational Team"
        elif c_idx == 1:
            name = "Specialist Contributor Group"
        else:
            name = f"Workforce Segment {c_idx + 1}"

        deduped_traits = list(dict.fromkeys(traits))
        cluster_size = int(np.sum(labels == c_idx))
        cluster_profiles.append({
            "cluster_id": c_idx,
            "name": name,
            "size": cluster_size,
            "percentage": round((cluster_size / len(df)) * 100, 1),
            "key_traits": deduped_traits if deduped_traits else ["Balanced Profile"]
        })

    # Assign segment name to each row
    segment_names = [cluster_profiles[l]["name"] for l in labels]

    return {
        "success": True,
        "silhouette_score": sil_score,
        "n_clusters": actual_k,
        "features_used": cols_to_use,
        "cluster_profiles": cluster_profiles,
        "labels": [int(l) for l in labels],
        "segment_names": segment_names
    }
