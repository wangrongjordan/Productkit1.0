-- Migration: create_categories_table
-- Created at: 1756111432

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  level_1_name VARCHAR(255) NOT NULL,
  level_2_name VARCHAR(255),
  level_3_name VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 创建唯一索引确保分类组合的唯一性
  UNIQUE(level_1_name, level_2_name, level_3_name)
);;