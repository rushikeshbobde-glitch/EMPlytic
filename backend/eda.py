import pandas as pd
import numpy as np


def analyze_dataset(file_path: str):

    # --------------------------------
    # READ FILE
    # --------------------------------

    if file_path.lower().endswith(".csv"):
        df = pd.read_csv(file_path)

    elif file_path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(file_path)

    else:
        raise ValueError(
            "Only CSV and Excel files are supported."
        )


    # --------------------------------
    # BASIC INFORMATION
    # --------------------------------

    total_rows = len(df)

    total_columns = len(df.columns)


    # --------------------------------
    # DATA TYPES
    # --------------------------------

    numeric_columns = df.select_dtypes(
        include=np.number
    ).columns.tolist()


    categorical_columns = df.select_dtypes(
        exclude=np.number
    ).columns.tolist()


    # --------------------------------
    # MISSING VALUES
    # --------------------------------

    total_cells = df.shape[0] * df.shape[1]

    missing_cells = int(
        df.isnull().sum().sum()
    )


    if total_cells > 0:
        completeness = round(
            ((total_cells - missing_cells) /
             total_cells) * 100,
            2
        )
    else:
        completeness = 100


    missing_percentage = round(
        (missing_cells / total_cells) * 100,
        2
    ) if total_cells else 0


    # --------------------------------
    # DUPLICATES
    # --------------------------------

    duplicate_count = int(
        df.duplicated().sum()
    )


    duplicate_percentage = round(
        (duplicate_count / total_rows) * 100,
        2
    ) if total_rows else 0


    # --------------------------------
    # DEPARTMENT ANALYSIS
    # --------------------------------

    department_data = []


    department_column = None


    possible_department_names = [
        "department",
        "Department",
        "dept",
        "Dept"
    ]


    for column in possible_department_names:

        if column in df.columns:

            department_column = column

            break


    if department_column:

        department_counts = (
            df[department_column]
            .fillna("Unknown")
            .value_counts()
        )


        department_data = [
            {
                "department": str(index),
                "employees": int(value)
            }

            for index, value
            in department_counts.items()
        ]


    # --------------------------------
    # NUMERIC STATISTICS
    # --------------------------------

    statistics = {}


    for column in numeric_columns:

        statistics[column] = {

            "mean": round(
                float(df[column].mean()),
                2
            ),

            "median": round(
                float(df[column].median()),
                2
            ),

            "minimum": round(
                float(df[column].min()),
                2
            ),

            "maximum": round(
                float(df[column].max()),
                2
            )
        }


    # --------------------------------
    # DATA QUALITY
    # --------------------------------

    invalid_types = 0


    # --------------------------------
    # RESULT
    # --------------------------------

    result = {

        "success": True,

        "dataset": {

            "rows": total_rows,

            "columns": total_columns,

            "numeric_columns":
                len(numeric_columns),

            "categorical_columns":
                len(categorical_columns)
        },


        "data_quality": {

            "completeness":
                completeness,

            "missing_percentage":
                missing_percentage,

            "missing_values":
                missing_cells,

            "duplicate_records":
                duplicate_count,

            "duplicate_percentage":
                duplicate_percentage,

            "invalid_data_types":
                invalid_types
        },


        "columns": {

            "numeric":
                numeric_columns,

            "categorical":
                categorical_columns
        },


        "department_data":
            department_data,


        "statistics":
            statistics
    }


    return result