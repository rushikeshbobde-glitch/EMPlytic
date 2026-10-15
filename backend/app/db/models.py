import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="HR_USER", nullable=False)  # "HR_ADMIN", "HR_USER", "EMPLOYEE"
    employee_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class DatasetMetadata(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    cleaned_file_path = Column(String(500), nullable=True)
    total_rows = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    numeric_columns_json = Column(Text, default="[]")
    categorical_columns_json = Column(Text, default="[]")
    quality_score = Column(Float, default=100.0)
    missing_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)
    has_attrition_target = Column(Boolean, default=False)
    has_promotion_target = Column(Boolean, default=False)
    is_cleaned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employees = relationship("EmployeeRecord", back_populates="dataset", cascade="all, delete-orphan")
    columns = relationship("DatasetColumn", back_populates="dataset", cascade="all, delete-orphan")
    data_quality = relationship("DataQuality", back_populates="dataset", uselist=False, cascade="all, delete-orphan")
    reports = relationship("ReportRecord", back_populates="dataset", cascade="all, delete-orphan")

class DatasetColumn(Base):
    __tablename__ = "dataset_columns"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False, index=True)
    column_name = Column(String(150), nullable=False)
    data_type = Column(String(50), nullable=False)
    missing_pct = Column(Float, default=0.0)
    unique_values = Column(Integer, default=0)
    outlier_count = Column(Integer, default=0)
    status = Column(String(50), default="Valid")  # "Valid", "Missing Values", "High Cardinality", "Outliers"
    sample_values_json = Column(Text, default="[]")
    semantic_role = Column(String(100), nullable=True)

    dataset = relationship("DatasetMetadata", back_populates="columns")

class DataQuality(Base):
    __tablename__ = "data_quality"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False, unique=True, index=True)
    quality_score = Column(Float, default=100.0)
    completeness_pct = Column(Float, default=100.0)
    missing_values = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    invalid_values = Column(Integer, default=0)
    outlier_count = Column(Integer, default=0)
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("DatasetMetadata", back_populates="data_quality")

class EmployeeRecord(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True, index=True)
    employee_id = Column(String(100), index=True, nullable=True)
    name = Column(String(150), nullable=True)
    department = Column(String(100), default="General", index=True)
    job_role = Column(String(100), default="Specialist")
    salary = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    performance = Column(Float, nullable=True)
    productivity = Column(Float, nullable=True)
    satisfaction = Column(Float, nullable=True)
    attrition_risk = Column(String(50), default="Low")  # "Low", "Medium", "High"
    attrition_probability = Column(Float, default=0.0)
    promotion_readiness = Column(String(50), default="Developing")  # "Ready", "Developing", "Not Ready"
    promotion_score = Column(Float, default=0.0)
    cluster_segment = Column(String(100), default="Core Workforce")
    skill_gaps_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")
    raw_data_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("DatasetMetadata", back_populates="employees")
    performance_scores = relationship("PerformanceScore", back_populates="employee", cascade="all, delete-orphan")
    productivity_scores = relationship("ProductivityScore", back_populates="employee", cascade="all, delete-orphan")
    attrition_predictions = relationship("AttritionPrediction", back_populates="employee", cascade="all, delete-orphan")
    promotion_predictions = relationship("PromotionPrediction", back_populates="employee", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="employee", cascade="all, delete-orphan")
    training_recommendations = relationship("TrainingRecommendation", back_populates="employee", cascade="all, delete-orphan")

class PerformanceScore(Base):
    __tablename__ = "performance_scores"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    rating = Column(String(50), default="Good")  # "Excellent", "Good", "Average", "Needs Improvement"
    factors_json = Column(Text, default="[]")
    evaluation_date = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeRecord", back_populates="performance_scores")

class ProductivityScore(Base):
    __tablename__ = "productivity_scores"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    productivity_score = Column(Float, nullable=False)
    category = Column(String(50), default="High Productivity")
    factors_json = Column(Text, default="[]")
    evaluation_date = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeRecord", back_populates="productivity_scores")

class AttritionPrediction(Base):
    __tablename__ = "attrition_predictions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    risk_probability = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)  # "Low", "Medium", "High"
    model_name = Column(String(100), default="RandomForestClassifier")
    important_factors_json = Column(Text, default="[]")  # SHAP / Feature importances
    prediction_date = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeRecord", back_populates="attrition_predictions")

class PromotionPrediction(Base):
    __tablename__ = "promotion_predictions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    readiness_probability = Column(Float, nullable=False)
    readiness_level = Column(String(50), nullable=False)  # "Ready", "Developing", "Not Ready"
    model_name = Column(String(100), default="RandomForestClassifier")
    important_factors_json = Column(Text, default="[]")
    prediction_date = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeRecord", back_populates="promotion_predictions")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(100), default="Technical")
    department = Column(String(100), default="General")
    required_level = Column(Float, default=75.0)

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    current_level = Column(Float, default=0.0)
    required_level = Column(Float, default=80.0)
    gap_pct = Column(Float, default=0.0)
    priority = Column(String(50), default="Medium")  # "High", "Medium", "Low"

    employee = relationship("EmployeeRecord", back_populates="skill_gaps")

class TrainingRecommendation(Base):
    __tablename__ = "training_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    training_name = Column(String(200), nullable=False)
    skill = Column(String(100), nullable=False)
    priority = Column(String(50), default="High")  # "High", "Medium", "Low"
    duration = Column(String(50), default="4 Weeks")
    difficulty = Column(String(50), default="Intermediate")
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeRecord", back_populates="training_recommendations")

class ReportRecord(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    report_type = Column(String(100), default="executive")  # "executive", "performance", "attrition", "promotion", "skill_gap"
    format = Column(String(50), default="pdf")  # "pdf", "excel", "html"
    file_path = Column(String(500), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("DatasetMetadata", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # "LOGIN", "DATASET_UPLOAD", "DATASET_CLEAN", "PREDICTION_RUN", "REPORT_GENERATE"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
